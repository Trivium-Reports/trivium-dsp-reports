#!/usr/bin/env python3
"""
Trivium DSP data refresh — GitHub Actions runtime, multi-client monorepo.

Called by .github/workflows/refresh-data.yml on a weekly cron.
Hits /gmail-ingest once to pull any new Amazon Ads report emails into
Netlify Blobs (Blobs are partitioned by client slug). Then for each
client in CLIENTS, fetches its latest CSV via /data-export, aggregates
to per-day in the 22-column TheraIce parser format, trims to the most
recent 14 days, and writes to public/data/<slug>/dsp.csv.

The workflow YAML handles git commit + push of all changed CSVs.

Env vars (set in workflow):
  AUTH_ADMIN_TOKEN   bearer token gating the Trivium auth site admin endpoints
"""

import os
import sys
import csv
import json
import urllib.request
import urllib.error
from collections import defaultdict
from datetime import datetime, timezone
from io import StringIO
from pathlib import Path

# ── Configuration ────────────────────────────────────────────

AUTH_BASE = "https://trivium-amazon-ads-auth.netlify.app"
AUTH_TOKEN = os.environ.get("AUTH_ADMIN_TOKEN")

# Client roster — mirrors src/config/clients.ts. Slugs MUST match the patterns
# in the auth site's gmail-ingest.mts REPORT_PATTERNS or the Blob won't be found.
CLIENTS = [
    {"slug": "mirai-clinical",        "slot": "dsp", "name": "Mirai Clinical"},
    {"slug": "dura-cleanse",          "slot": "dsp", "name": "Dura Cleanse"},
    {"slug": "fit-and-fresh",         "slot": "dsp", "name": "Fit + Fresh"},
    {"slug": "survival-garden-seeds", "slot": "dsp", "name": "Survival Garden Seeds"},
    # Onboarded 2026-06-08 — second wave: 14 brands
    {"slug": "primal-queen",          "slot": "dsp", "name": "Primal Queen"},
    {"slug": "woxer",                 "slot": "dsp", "name": "Woxer"},
    {"slug": "wander-beauty",         "slot": "dsp", "name": "Wander Beauty"},
    {"slug": "sprinkle-and-sweep",    "slot": "dsp", "name": "Sprinkle & Sweep"},
    {"slug": "paradise-naturals",     "slot": "dsp", "name": "Paradise Naturals"},
    {"slug": "healthy-bones",         "slot": "dsp", "name": "Healthy Bones"},
    {"slug": "probiora",              "slot": "dsp", "name": "ProBiora Plus"},
    {"slug": "honey-bae",             "slot": "dsp", "name": "Honey Bae"},
    {"slug": "sud-scrub",             "slot": "dsp", "name": "Sud Scrub"},
    {"slug": "future-kind",           "slot": "dsp", "name": "Future Kind+"},
    {"slug": "jarmino",               "slot": "dsp", "name": "Jarmino"},
    {"slug": "daron",                 "slot": "dsp", "name": "Daron Worldwide"},
    {"slug": "theraice",              "slot": "dsp", "name": "TheraICE"},
    {"slug": "dexas",                 "slot": "dsp", "name": "Dexas"},
    # Mirai-only: Sponsored Ads conversion path report (different data shape, pass-through)
    {"slug": "mirai-clinical",        "slot": "conv-path", "name": "Mirai Clinical (conv path)"},
]

if not AUTH_TOKEN:
    sys.exit("ERR: AUTH_ADMIN_TOKEN not set. Add it as a GitHub repo secret.")

# ── HTTP helpers ─────────────────────────────────────────────

def http_get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers or {}), e.read() if hasattr(e, "read") else b""

def auth_headers():
    return {"Authorization": f"Bearer {AUTH_TOKEN}"}

# ── Aggregation ──────────────────────────────────────────────

def num(s):
    if s is None:
        return 0.0
    s = str(s).replace("=", "").replace('"', "").replace("%", "").replace(",", "").strip()
    try:
        return float(s) if s else 0.0
    except ValueError:
        return 0.0

def _first_present(row, *candidates):
    """Return num(row[k]) for the first candidate key that exists in row,
    else 0. Lets us tolerate Amazon header variants without exploding."""
    for k in candidates:
        if k in row:
            return num(row[k])
    return 0.0


# NTB sales column variants (Amazon has shipped at least two of these)
NTB_SALES_KEYS = (
    "New-to-brand product sales USD",
    "New-to-brand product sales (USD)",
    "New-to-Brand product sales USD",
    "New-to-Brand product sales (USD)",
    "New to brand product sales USD",
    "NTB product sales USD",
)
TOTAL_NTB_SALES_KEYS = (
    "Total new-to-brand product sales USD",
    "Total new-to-brand product sales (USD)",
    "Total New-to-brand product sales USD",
    "Total New-to-Brand product sales USD",
    "Total New-to-Brand product sales (USD)",
    "Total NTB product sales USD",
)
SALES_KEYS = ("Sales USD", "Sales (USD)", "Sales")
TOTAL_SALES_KEYS = ("Total sales USD", "Total sales (USD)", "Total Sales USD", "Total sales")


def aggregate_dsp(raw_csv):
    """
    Per-(date × campaign × ad group × ad) granular Amazon DSP CSV
    → per-day summary in 22-column TheraIce parser format,
    trimmed to the most recent 14 days.
    """
    rows = list(csv.DictReader(StringIO(raw_csv)))
    if not rows:
        raise ValueError("Empty CSV")

    # Header echo — print once per brand so we can spot Amazon schema drift
    # quickly. Tiny log cost, huge debugging payoff.
    headers = list(rows[0].keys())
    sample_ntb_like = [h for h in headers if "ntb" in h.lower() or "new-to" in h.lower() or "new to" in h.lower()]
    print(f"  ⓘ source columns: {len(headers)} total")
    print(f"    NTB-like headers: {sample_ntb_like}")

    by_date = defaultdict(lambda: defaultdict(float))
    brand = ""
    brand_id = 0.0

    for r in rows:
        d = r["Date"].strip()
        if not brand:
            brand = r.get("Advertiser account name", "").strip()
            brand_id = num(r.get("Advertiser account ID", ""))
        by_date[d]["spend"]               += num(r.get("Total cost"))
        by_date[d]["impressions"]         += num(r.get("Impressions"))
        by_date[d]["clicks"]              += num(r.get("Click-throughs"))
        by_date[d]["dpv"]                 += num(r.get("DPV"))
        by_date[d]["atc"]                 += num(r.get("ATC"))
        by_date[d]["purchases"]           += num(r.get("Purchases"))
        by_date[d]["ntb_purchases"]       += num(r.get("New-to-brand purchases"))
        by_date[d]["sales"]               += _first_present(r, *SALES_KEYS)
        # Amazon DSP doesn't ship a click-attributed "New-to-brand product
        # sales USD" column — only the 14-day attribution version. Alias
        # ntb_sales to that single source so the dashboard's NTB Sales card
        # displays the real value instead of a hardcoded $0.
        by_date[d]["ntb_sales"]           += _first_present(r, *NTB_SALES_KEYS, *TOTAL_NTB_SALES_KEYS)
        by_date[d]["total_dpv"]           += num(r.get("Total DPV"))
        by_date[d]["total_atc"]           += num(r.get("Total ATC"))
        by_date[d]["total_purchases"]     += num(r.get("Total purchases"))
        by_date[d]["total_ntb_purchases"] += num(r.get("Total new-to-brand purchases"))
        by_date[d]["total_sales"]         += _first_present(r, *TOTAL_SALES_KEYS)
        by_date[d]["total_ntb_sales"]     += _first_present(r, *TOTAL_NTB_SALES_KEYS)

    # Amazon sends "Previous 30 days" — trim to the most recent 14 for the
    # rolling 2-week dashboard window. Fewer than 14 → keep what we have.
    all_dates = sorted(by_date.keys(), key=lambda d: datetime.strptime(d, "%b %d, %Y"))
    dates = all_dates[-14:]

    HEADER = [
        "Date", "Advertiser account name", "Advertiser account ID",
        "Total cost", "Impressions", "CTR", "DPV", "ATC",
        "Purchases", "New-to-brand purchases", "Percent of purchases new-to-brand",
        "Sales USD", "New-to-brand product sales USD",
        "Total DPV", "Total ATC", "Total purchases", "Total new-to-brand purchases",
        "Total new-to-brand purchases clicks",
        "Total percent of purchases new-to-brand", "Total sales USD",
        "Total ROAS", "Total new-to-brand product sales USD",
    ]

    out = StringIO()
    w = csv.writer(out, quoting=csv.QUOTE_ALL)
    w.writerow(HEADER)
    for d in dates:
        a = by_date[d]
        ctr_pct       = (a["clicks"] / a["impressions"] * 100) if a["impressions"] else 0
        ntb_pct       = (a["ntb_purchases"] / a["purchases"] * 100) if a["purchases"] else 0
        total_ntb_pct = (a["total_ntb_purchases"] / a["total_purchases"] * 100) if a["total_purchases"] else 0
        total_roas    = (a["total_sales"] / a["spend"]) if a["spend"] else 0
        w.writerow([
            d, brand, f'="{int(brand_id)}"',
            f"{a['spend']:.5f}", int(a["impressions"]), f"{ctr_pct:.4f}%",
            int(a["dpv"]), int(a["atc"]),
            int(a["purchases"]), int(a["ntb_purchases"]), f"{ntb_pct:.4f}%",
            f"{a['sales']:.5f}", f"{a['ntb_sales']:.5f}",
            int(a["total_dpv"]), int(a["total_atc"]),
            int(a["total_purchases"]), int(a["total_ntb_purchases"]), 0,
            f"{total_ntb_pct:.4f}%", f"{a['total_sales']:.5f}",
            f"{total_roas:.5f}", f"{a['total_ntb_sales']:.5f}",
        ])

    # ── Sanity checks (added 2026-06-08 after the NTB-sales-stub bug) ──
    # Catch silent-zero categories so we never ship hardcoded placeholder
    # columns again. Each check is a logical invariant on aggregated input.
    totals = {
        k: sum(by_date[d][k] for d in dates)
        for k in (
            "spend", "impressions", "purchases",
            "ntb_purchases", "ntb_sales",
            "sales", "total_sales", "total_ntb_sales",
        )
    }
    violations = []
    if totals["ntb_purchases"] > 0 and totals["ntb_sales"] <= 0:
        violations.append(
            f"ntb_purchases={totals['ntb_purchases']:.0f} but ntb_sales=0 "
            f"(input had non-zero NTB purchases — sales aggregation likely broken)"
        )
    if totals["purchases"] > 0 and totals["sales"] <= 0:
        violations.append(
            f"purchases={totals['purchases']:.0f} but sales=0 "
            f"(sales column missing or mis-named in source CSV)"
        )
    if totals["impressions"] > 0 and totals["spend"] <= 0:
        violations.append(
            f"impressions={totals['impressions']:.0f} but spend=0 "
            f"(spend column missing or mis-named)"
        )
    if violations:
        raise ValueError(
            "Data-quality sanity check failed:\n  - "
            + "\n  - ".join(violations)
        )

    return out.getvalue(), len(dates)

# ── Per-client refresh ───────────────────────────────────────

def refresh_one(client):
    slug, slot, name = client["slug"], client["slot"], client["name"]
    print(f"\n--- {name} ({slug}/{slot}) ---")

    url = f"{AUTH_BASE}/data-export?client={slug}&slot={slot}&latest=true"
    status, headers, body = http_get(url, auth_headers())
    if status == 404:
        print(f"  ⊘ no CSV yet for this client/slot (skipping — will appear next run)")
        return False
    if status != 200:
        print(f"  ✗ data-export FAILED {status}: {body[:300]!r}")
        return False

    captured = headers.get("x-captured-at") or headers.get("X-Captured-At") or "unknown"
    print(f"  ✓ fetched {len(body)} bytes (captured {captured})")

    # Per-slot handling. DSP gets 14-day aggregation; conv-path is a different
    # report shape (Sponsored Ads conversion path) — pass through as-is.
    raw = body.decode("utf-8")
    try:
        if slot == "dsp":
            out_csv, n = aggregate_dsp(raw)
            row_label = f"{n} daily rows"
        elif slot == "conv-path":
            out_csv, n = passthrough_csv(raw)
            row_label = f"{n} path rows"
        else:
            # Default to pass-through for unknown slots
            out_csv, n = passthrough_csv(raw)
            row_label = f"{n} rows"
    except Exception as e:
        print(f"  ✗ processing failed: {e}")
        return False

    out_path = Path(f"public/data/{slug}/{slot}.csv")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out_csv)
    print(f"  ✓ wrote {out_path} ({row_label})")
    return True


def passthrough_csv(raw_csv: str):
    """Light pass-through for non-DSP slots: strips BOM, normalises line endings,
    counts data rows. Keeps the schema as Amazon delivered it."""
    cleaned = raw_csv.lstrip("﻿").replace("\r\n", "\n").replace("\r", "\n")
    lines = [line for line in cleaned.split("\n") if line.strip()]
    if not lines:
        raise ValueError("Empty CSV")
    n_data_rows = max(0, len(lines) - 1)
    return "\n".join(lines) + "\n", n_data_rows

# ── Main ─────────────────────────────────────────────────────

def main():
    print(f"=== Trivium DSP refresh @ {datetime.now(timezone.utc).isoformat()} ===")
    print(f"  clients = {[c['slug'] for c in CLIENTS]}")
    print()

    # 1. Trigger /gmail-ingest ONCE — it processes all recent Amazon emails
    #    and partitions blobs by client slug based on REPORT_PATTERNS.
    print(f"[ingest] calling {AUTH_BASE}/gmail-ingest?lookback_days=14")
    status, _, body = http_get(f"{AUTH_BASE}/gmail-ingest?lookback_days=14", auth_headers())
    if status != 200:
        print(f"  ✗ FAILED {status}: {body[:500]!r}")
        sys.exit(1)
    data = json.loads(body)
    print(
        f"  ✓ found={data.get('found', 0)} "
        f"processed={len(data.get('processed', []))} "
        f"skipped={len(data.get('skipped', []))} "
        f"errors={len(data.get('errors', []))}"
    )
    for err in data.get("errors", []):
        print(f"    ! ingest error: {err}")

    # 2. For each client, fetch + aggregate + write
    refreshed = []
    skipped = []
    for c in CLIENTS:
        if refresh_one(c):
            refreshed.append(c["slug"])
        else:
            skipped.append(c["slug"])

    print(f"\n=== Done ===")
    print(f"  refreshed: {refreshed or '(none)'}")
    print(f"  skipped:   {skipped or '(none)'}")

if __name__ == "__main__":
    main()
