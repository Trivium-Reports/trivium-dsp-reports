/**
 * Amazon Sponsored Ads — Conversion Path report parser.
 *
 * Schema frozen 2026-07-31 against real exports (Primal Queen, Sud Scrub,
 * Dexas, Paradise Naturals, ProBiora). Amazon's export has 20 columns:
 *
 *   Start Date, End Date, Brand, Conversion path, Sales, Purchases,
 *   New-to-brand product sales, New-to-brand purchases,
 *   <11 per-ad-type "frequency" columns>, Currency
 *
 * The frequency columns are the actual signal: each row is one distinct
 * conversion path, and the frequency columns say how many times each ad type
 * appeared on it. There is NO cost/spend column, so path-level ROAS cannot be
 * computed and must never be displayed.
 *
 * Rows are grouped into four path types by which ad families appear:
 *   DSP + Sponsored Ads · Amazon DSP only · Sponsored Ads, multi-touch ·
 *   Sponsored Ads, single touch
 */

/* ── Column groups ─────────────────────────────────────────── */

const DSP_COLS = [
  "Amazon DSP display frequency",
  "Amazon DSP online video frequency",
  "Amazon DSP streaming TV frequency",
  "Amazon DSP audio frequency",
];

const SA_COLS = [
  "Sponsored Brands display frequency",
  "Sponsored Display display frequency",
  "Sponsored Brands video frequency",
  "Sponsored TV streaming TV frequency",
  "Sponsored Products frequency",
  "Sponsored Display frequency",
  "Sponsored Display online video frequency",
];

export type PathType =
  | "DSP + Sponsored Ads"
  | "Amazon DSP only"
  | "Sponsored Ads, multi-touch"
  | "Sponsored Ads, single touch";

/** Display order — also the donut order. */
export const PATH_TYPE_ORDER: PathType[] = [
  "DSP + Sponsored Ads",
  "Amazon DSP only",
  "Sponsored Ads, multi-touch",
  "Sponsored Ads, single touch",
];

/** hsl() strings so the donut stays inside the report's palette. */
export const PATH_TYPE_COLORS: Record<PathType, string> = {
  "DSP + Sponsored Ads": "hsl(25, 100%, 50%)",
  "Amazon DSP only": "hsl(213, 51%, 25%)",
  "Sponsored Ads, multi-touch": "hsl(36, 78%, 57%)",
  "Sponsored Ads, single touch": "hsl(210, 10%, 64%)",
};

/* ── Types ─────────────────────────────────────────────────── */

export interface ConvPathRow {
  path: string;
  sales: number;
  purchases: number;
  ntbSales: number;
  ntbPurchases: number;
  dspTouches: number;
  saTouches: number;
  touches: number;
  pathType: PathType;
  raw: Record<string, string>;
}

export interface PathTypeGroup {
  pathType: PathType;
  paths: number;
  sales: number;
  purchases: number;
  ntbSales: number;
  ntbPurchases: number;
  /** Purchase-weighted mean touchpoints on the path. */
  avgTouches: number;
  pctOfSales: number;
  ntbSharePct: number;
  color: string;
}

export interface ConvPathSummary {
  rows: ConvPathRow[];
  groups: PathTypeGroup[];
  totals: {
    paths: number;
    sales: number;
    purchases: number;
    ntbSales: number;
    ntbPurchases: number;
    ntbSharePct: number;
  };
  period: { start: string; end: string };
  currency: string;
  hasUsefulData: boolean;
  rawColumnNames: string[];
}

/* ── CSV parsing ───────────────────────────────────────────── */

function parseCsv(raw: string): Record<string, string>[] {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const lines: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); lines.push(row); row = []; field = ""; }
    else field += c;
  }
  row.push(field);
  lines.push(row);

  const headers = (lines.shift() ?? []).map(h => h.trim());
  return lines
    .filter(l => l.some(v => v.trim() !== ""))
    .map(l => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = (l[i] ?? "").trim(); });
      return o;
    });
}

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[$,%\s]/g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Tolerant header lookup — Amazon varies capitalisation between exports. */
function pick(row: Record<string, string>, name: string): string | undefined {
  if (name in row) return row[name];
  const lower = name.toLowerCase();
  const hit = Object.keys(row).find(k => k.toLowerCase() === lower);
  return hit ? row[hit] : undefined;
}

function classify(dspTouches: number, saTouches: number): PathType {
  if (dspTouches > 0 && saTouches > 0) return "DSP + Sponsored Ads";
  if (dspTouches > 0) return "Amazon DSP only";
  return dspTouches + saTouches > 1
    ? "Sponsored Ads, multi-touch"
    : "Sponsored Ads, single touch";
}

/* ── Public parser ─────────────────────────────────────────── */

export function parseConvPathReport(raw: string): ConvPathSummary {
  const records = parseCsv(raw);
  if (records.length === 0) return emptySummary([]);
  const headers = Object.keys(records[0]);

  const rows: ConvPathRow[] = records
    .filter(r => (pick(r, "Conversion path") ?? "").trim() !== "")
    .map(r => {
      const dspTouches = DSP_COLS.reduce((s, c) => s + num(pick(r, c)), 0);
      const saTouches = SA_COLS.reduce((s, c) => s + num(pick(r, c)), 0);
      return {
        path: (pick(r, "Conversion path") ?? "").trim(),
        sales: num(pick(r, "Sales")),
        purchases: num(pick(r, "Purchases")),
        ntbSales: num(pick(r, "New-to-brand product sales")),
        ntbPurchases: num(pick(r, "New-to-brand purchases")),
        dspTouches,
        saTouches,
        touches: dspTouches + saTouches,
        pathType: classify(dspTouches, saTouches),
        raw: r,
      };
    });

  const totalSales = rows.reduce((s, r) => s + r.sales, 0);
  const totalPurch = rows.reduce((s, r) => s + r.purchases, 0);
  const totalNtbSales = rows.reduce((s, r) => s + r.ntbSales, 0);
  const totalNtbPurch = rows.reduce((s, r) => s + r.ntbPurchases, 0);

  const groups: PathTypeGroup[] = PATH_TYPE_ORDER.map(pathType => {
    const gr = rows.filter(r => r.pathType === pathType);
    const sales = gr.reduce((s, r) => s + r.sales, 0);
    const purchases = gr.reduce((s, r) => s + r.purchases, 0);
    const ntbSales = gr.reduce((s, r) => s + r.ntbSales, 0);
    const touchWeighted = gr.reduce((s, r) => s + r.touches * r.purchases, 0);
    return {
      pathType,
      paths: gr.length,
      sales,
      purchases,
      ntbSales,
      ntbPurchases: gr.reduce((s, r) => s + r.ntbPurchases, 0),
      avgTouches: purchases > 0 ? touchWeighted / purchases : 0,
      pctOfSales: totalSales > 0 ? (sales / totalSales) * 100 : 0,
      ntbSharePct: sales > 0 ? (ntbSales / sales) * 100 : 0,
      color: PATH_TYPE_COLORS[pathType],
    };
  }).filter(g => g.paths > 0);

  const first = records[0];
  return {
    rows,
    groups,
    totals: {
      paths: rows.length,
      sales: totalSales,
      purchases: totalPurch,
      ntbSales: totalNtbSales,
      ntbPurchases: totalNtbPurch,
      ntbSharePct: totalSales > 0 ? (totalNtbSales / totalSales) * 100 : 0,
    },
    period: {
      start: (pick(first, "Start Date") ?? "").trim(),
      end: (pick(first, "End Date") ?? "").trim(),
    },
    currency: (pick(first, "Currency") ?? "USD").trim() || "USD",
    hasUsefulData: totalSales > 0 && groups.length > 0,
    rawColumnNames: headers,
  };
}

function emptySummary(headers: string[]): ConvPathSummary {
  return {
    rows: [],
    groups: [],
    totals: { paths: 0, sales: 0, purchases: 0, ntbSales: 0, ntbPurchases: 0, ntbSharePct: 0 },
    period: { start: "", end: "" },
    currency: "USD",
    hasUsefulData: false,
    rawColumnNames: headers,
  };
}
