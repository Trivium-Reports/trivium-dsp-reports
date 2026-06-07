import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Layers, ArrowRight, DollarSign, ShoppingCart, Activity } from "lucide-react";
import { parseConvPathReport, type ConvPathSummary } from "@/lib/conv-path-data";

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : n.toFixed(0);
const fmtCurrency = (n: number) => `$${fmt(n)}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

/**
 * Mirai-only Conversion Path section.
 *
 * Renders only when /data/<slug>/conv-path.csv exists and parses cleanly.
 * Silently no-ops on 404 (other brands) or when the CSV is missing.
 *
 * The "DSP × PPC interaction" story is the unique value here — this report
 * shows which combinations of DSP impressions + Sponsored Ads clicks
 * actually drive conversions, not just which channels did the last click.
 */

interface Props {
  slug: string;
}

const ConversionPathSection = ({ slug }: Props) => {
  const [summary, setSummary] = useState<ConvPathSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hadFile, setHadFile] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${slug}/conv-path.csv`)
      .then(r => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        // SPA fallback returns text/html when file doesn't exist
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("text/html")) throw new Error("html_fallback");
        return r.text();
      })
      .then(text => {
        const trimmed = text.trim();
        // Defensive: HTML or empty → no data
        if (!trimmed || trimmed.startsWith("<") || trimmed.split("\n").length < 2) {
          throw new Error("empty_or_html");
        }
        setHadFile(true);
        setSummary(parseConvPathReport(text));
      })
      .catch(() => {
        setHadFile(false);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Render nothing if no conv-path data for this brand (silent no-op
  // instead of an empty placeholder card per 2026-06-08 user direction)
  if (loading) return null;
  if (!hadFile || !summary) return null;
  if (!summary.hasUsefulData) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-6 sm:px-8 py-8 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="uppercase tracking-[0.2em] text-[10px] font-display font-bold text-primary">
            DSP × PPC Interaction
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">
          Conversion Path
        </h2>
        <p className="text-sm text-muted-foreground font-body max-w-2xl">
          How DSP impressions and Sponsored Ads touchpoints combine to drive
          conversions. Multi-touch paths often hide the true contribution of
          upper-funnel DSP.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
        <Stat icon={ShoppingCart} label="Path conversions" value={fmt(summary.totals.conversions)} />
        <Stat icon={DollarSign} label="Path sales" value={fmtCurrency(summary.totals.sales)} />
        <Stat icon={Activity} label="Path spend" value={fmtCurrency(summary.totals.spend)} />
        <Stat icon={Layers} label="Path ROAS" value={summary.totals.roas.toFixed(2)} />
      </div>

      <div className="px-6 sm:px-8 py-8 grid md:grid-cols-3 gap-6">
        <Insight
          title="DSP-involved paths"
          headline={fmtPct(summary.dspInvolvedShare.pctOfConversions)}
          subline={`of conversions · ${fmtCurrency(summary.dspInvolvedShare.salesUsd)} in sales`}
          detail={`${summary.dspInvolvedShare.pathCount} of ${summary.rows.length} paths included a DSP touchpoint`}
        />
        <Insight
          title="Sponsored Ads paths"
          headline={fmtPct(summary.spInvolvedShare.pctOfConversions)}
          subline={`of conversions · ${fmtCurrency(summary.spInvolvedShare.salesUsd)} in sales`}
          detail={`${summary.spInvolvedShare.pathCount} of ${summary.rows.length} paths included a Sponsored touchpoint`}
        />
        <Insight
          title="Multi-touch share"
          headline={fmtPct(summary.multiTouchShare.pctOfConversions)}
          subline={`of conversions involved 2+ touches`}
          detail={`${summary.multiTouchShare.pathCount} multi-touch paths out of ${summary.rows.length}`}
        />
      </div>

      <div className="px-6 sm:px-8 pb-8">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Top paths by conversions
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2.5 font-display font-bold text-xs uppercase tracking-wider">Path</th>
                <th className="px-4 py-2.5 font-display font-bold text-xs uppercase tracking-wider text-right">Conv</th>
                <th className="px-4 py-2.5 font-display font-bold text-xs uppercase tracking-wider text-right">Sales</th>
                <th className="px-4 py-2.5 font-display font-bold text-xs uppercase tracking-wider text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {summary.topByConversions.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2.5 font-mono text-xs leading-relaxed">
                    <PathBadges path={row.path} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-display font-bold tabular-nums">{fmt(row.conversions)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtCurrency(row.sales)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.roas.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="bg-card px-5 py-4">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-[10px] uppercase tracking-wider font-display font-bold text-muted-foreground">{label}</span>
    </div>
    <p className="font-display font-extrabold text-xl tracking-tight tabular-nums">{value}</p>
  </div>
);

const Insight = ({ title, headline, subline, detail }: { title: string; headline: string; subline: string; detail: string }) => (
  <div className="bg-muted/40 border border-border rounded-xl p-5">
    <p className="text-[10px] uppercase tracking-wider font-display font-bold text-muted-foreground mb-2">{title}</p>
    <p className="font-display font-extrabold text-3xl tabular-nums mb-1">{headline}</p>
    <p className="text-xs text-foreground font-body mb-2">{subline}</p>
    <p className="text-xs text-muted-foreground font-body leading-relaxed">{detail}</p>
  </div>
);

const PathBadges = ({ path }: { path: string }) => {
  // Split on common arrow separators; render each token as a chip
  const tokens = path.split(/\s*(?:>|→|->)\s*/).filter(Boolean);
  if (tokens.length === 0) {
    return <span>{path}</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {tokens.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[11px] font-display font-semibold text-primary">
            {t}
          </span>
          {i < tokens.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
        </span>
      ))}
    </span>
  );
};

export default ConversionPathSection;
