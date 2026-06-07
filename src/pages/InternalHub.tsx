import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import triviumLogo from "@/assets/trivium-logo.png";
import { CLIENTS } from "@/config/clients";

/**
 * /internal — internal-only brand index.
 *
 * NOT linked from anywhere public. Discovery requires knowing the URL
 * (security through obscurity per 2026-06-08 decision). Lists every
 * active client with a click-through to their dashboard, plus a
 * data-freshness check per brand.
 *
 * If/when this needs proper auth, wrap with Netlify password
 * protection or a Netlify edge function checking an Authorization
 * header — both are non-breaking additions.
 */
type Freshness = "loading" | "fresh" | "stale" | "pending";

interface BrandStatus {
  freshness: Freshness;
  rows: number;
  latestDate: string | null;
}

const RECENT_THRESHOLD_DAYS = 10; // CSVs older than this are considered "stale"

const InternalHub = () => {
  const [statuses, setStatuses] = useState<Record<string, BrandStatus>>({});

  useEffect(() => {
    let cancelled = false;
    CLIENTS.filter(c => c.active).forEach(client => {
      fetch(`/data/${client.slug}/dsp.csv`)
        .then(r => (r.ok ? r.text() : Promise.reject(r.status)))
        .then(text => {
          if (cancelled) return;
          const lines = text.trim().split("\n");
          if (lines.length < 2) {
            setStatuses(s => ({
              ...s,
              [client.slug]: { freshness: "pending", rows: 0, latestDate: null },
            }));
            return;
          }
          // Parse the LAST data row's first column (Date)
          const lastRow = lines[lines.length - 1];
          const firstCell = lastRow.split(",")[0]?.replaceAll('"', "").trim() || "";
          const parsed = new Date(firstCell);
          const ageDays = isNaN(parsed.getTime())
            ? Infinity
            : Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
          setStatuses(s => ({
            ...s,
            [client.slug]: {
              freshness: ageDays <= RECENT_THRESHOLD_DAYS ? "fresh" : "stale",
              rows: lines.length - 1,
              latestDate: isNaN(parsed.getTime()) ? firstCell : firstCell,
            },
          }));
        })
        .catch(() => {
          if (cancelled) return;
          setStatuses(s => ({
            ...s,
            [client.slug]: { freshness: "pending", rows: 0, latestDate: null },
          }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeClients = CLIENTS.filter(c => c.active);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18 py-4">
          <div className="flex items-center gap-0.5">
            <img src={triviumLogo} alt="Trivium" className="h-10 w-auto" />
            <span className="font-display font-extrabold text-xl uppercase tracking-tight">
              TRIVIUM
            </span>
          </div>
          <span className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
            Internal · {activeClients.length} brands
          </span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <p className="uppercase tracking-[0.2em] text-xs font-display font-bold text-muted-foreground mb-3">
            DSP Brand Index · Internal Use
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mb-3">
            Trivium DSP Dashboards
          </h1>
          <p className="text-base text-muted-foreground font-body max-w-2xl">
            Click any brand to open its current DSP performance report. Status badges show
            whether the latest CSV is recent (within {RECENT_THRESHOLD_DAYS} days), stale,
            or pending first ingest.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeClients.map(client => {
            const status = statuses[client.slug];
            const freshness = status?.freshness ?? "loading";
            const badgeColor =
              freshness === "fresh"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : freshness === "stale"
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : freshness === "pending"
                ? "bg-slate-100 text-slate-600 border-slate-200"
                : "bg-slate-50 text-slate-400 border-slate-100";
            const badgeLabel =
              freshness === "fresh"
                ? "Fresh"
                : freshness === "stale"
                ? "Stale"
                : freshness === "pending"
                ? "Pending"
                : "…";
            return (
              <Link
                key={client.slug}
                to={`/${client.slug}`}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <h2 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                    {client.name}
                  </h2>
                  <span
                    className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-display font-bold uppercase tracking-wider border ${badgeColor}`}
                  >
                    {badgeLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mb-3">
                  /{client.slug}
                </p>
                {status?.latestDate && (
                  <p className="text-xs text-muted-foreground font-body">
                    Latest: {status.latestDate} · {status.rows} rows
                  </p>
                )}
                {status?.freshness === "pending" && (
                  <p className="text-xs text-muted-foreground font-body italic">
                    Awaiting first Amazon report email.
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="uppercase tracking-[0.2em] text-[10px] font-display font-bold text-muted-foreground mb-2">
            Operations
          </p>
          <ul className="text-sm text-muted-foreground font-body space-y-1.5">
            <li>
              GitHub Actions: <a
                href="https://github.com/Trivium-Reports/trivium-dsp-reports/actions/workflows/refresh-data.yml"
                target="_blank" rel="noreferrer"
                className="text-primary hover:underline"
              >DSP data refresh (all clients)</a>
            </li>
            <li>
              Slack: <span className="font-mono text-xs">#dsp-report-drafts</span> — bi-weekly briefings (even ISO weeks, Mondays 7 AM PT)
            </li>
            <li>
              Auth/ingest: <a
                href="https://trivium-amazon-ads-auth.netlify.app"
                target="_blank" rel="noreferrer"
                className="text-primary hover:underline"
              >trivium-amazon-ads-auth</a>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default InternalHub;
