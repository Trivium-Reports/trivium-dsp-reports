import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GitBranch } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import {
  parseConvPathReport,
  type ConvPathSummary,
  type PathTypeGroup,
} from "@/lib/conv-path-data";

/**
 * Sponsored Ads conversion path section — DSP × PPC path to conversion.
 *
 * Renders only when /data/<slug>/conv-path.csv exists and parses cleanly;
 * silent no-op otherwise (per 2026-06-08 direction: no empty placeholders).
 *
 * Data only — no interpretation, no commentary (client-report standard).
 * Amazon's export carries no cost column, so no path-level ROAS is shown.
 *
 * Interaction: click or hover a donut slice or a table row to expand that
 * path type; the donut centre and the table highlight follow the selection.
 */

const currency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code || "USD",
    maximumFractionDigits: 0,
  }).format(n);
const int = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
const pct = (n: number) => `${n.toFixed(1)}%`;

const fmtDate = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
};

/** Expanded slice: pushes out and grows, matching the report's motion feel. */
const ActiveSlice = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 10}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={3}
    />
  );
};

interface Props {
  slug: string;
  /** Slide number shown in the Strategic Insight Deck bar. */
  num?: string;
}

const ConversionPathSection = ({ slug, num = "09" }: Props) => {
  const [summary, setSummary] = useState<ConvPathSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hadFile, setHadFile] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/${slug}/conv-path.csv`)
      .then(r => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("text/html")) throw new Error("html_fallback");
        return r.text();
      })
      .then(text => {
        const trimmed = text.trim();
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

  const active = selected !== null ? selected : hovered;
  const groups: PathTypeGroup[] = summary?.groups ?? [];
  const chartData = useMemo(
    () => groups.map(g => ({ name: g.pathType, value: g.sales, color: g.color })),
    [groups]
  );

  if (loading) return null;
  if (!hadFile || !summary) return null;
  if (!summary.hasUsefulData) return null;

  const { totals, period, currency: code } = summary;
  const focus = active !== null ? groups[active] : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      {/* Section header — matches the report's slide header pattern */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-6 border-b border-border">
        <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary mb-1 flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5" /> DSP × PPC Interaction
        </p>
        <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight mb-2">
          Path to Conversion
        </h2>
        <p className="font-body text-sm text-muted-foreground">
          {period.start && period.end
            ? `${fmtDate(period.start)} – ${fmtDate(period.end)} · `
            : ""}
          {int(totals.paths)} distinct conversion paths
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border">
        {[
          { label: "Attributed Sales", value: currency(totals.sales, code) },
          { label: "Purchases", value: int(totals.purchases) },
          { label: "New-to-Brand Sales", value: pct(totals.ntbSharePct) },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="px-6 md:px-8 py-6"
          >
            <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              {k.label}
            </p>
            <p className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">{k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Donut + breakdown */}
      <div className="px-6 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-10 items-center">
        <div className="relative h-[260px] w-full max-w-[260px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={104}
                paddingAngle={1.5}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive
                animationDuration={700}
                activeIndex={active ?? undefined}
                activeShape={ActiveSlice}
                onMouseEnter={(_, i) => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={(_, i) => setSelected(prev => (prev === i ? null : i))}
                className="cursor-pointer"
              >
                {chartData.map(d => (
                  <Cell
                    key={d.name}
                    fill={d.color}
                    opacity={active === null || d.name === focus?.pathType ? 1 : 0.32}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centre readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <p className="font-display font-extrabold text-2xl tracking-tight leading-none">
              {focus ? pct(focus.pctOfSales) : "100%"}
            </p>
            <p className="font-display font-bold text-sm mt-1">
              {currency(focus ? focus.sales : totals.sales, code)}
            </p>
            <p className="font-body text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground mt-1.5 leading-[1.3] w-[116px]">
              {focus ? focus.pathType : "Total attributed sales"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 md:-mx-8 lg:mx-0 px-6 md:px-8 lg:px-0">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["Path Type", "% Sales", "Sales", "Purchases", "Avg Impressions", "NTB %"].map((h, i) => (
                  <th
                    key={h}
                    className={`font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground pb-3 ${
                      i === 0 ? "text-left" : "text-right pl-3"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr
                  key={g.pathType}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(prev => (prev === i ? null : i))}
                  className={`border-b border-border/60 cursor-pointer transition-colors ${
                    active === i ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <td className="py-3 pr-3">
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${active === i ? "ring-2 ring-offset-1 ring-primary/40" : ""}`}
                        style={{ background: g.color }}
                      />
                      <span className="font-body font-semibold text-[13px]">{g.pathType}</span>
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-right font-display font-extrabold text-[15px] tabular-nums">
                    {pct(g.pctOfSales)}
                  </td>
                  <td className="py-3 pl-3 text-right font-body font-semibold text-[13px] tabular-nums">
                    {currency(g.sales, code)}
                  </td>
                  <td className="py-3 pl-3 text-right font-body font-semibold text-[13px] tabular-nums">
                    {int(g.purchases)}
                  </td>
                  <td className="py-3 pl-3 text-right font-body font-semibold text-[13px] tabular-nums">
                    {g.avgImpressions.toFixed(1)}
                  </td>
                  <td className="py-3 pl-3 text-right font-body font-semibold text-[13px] tabular-nums">
                    {pct(g.ntbSharePct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-6 md:px-8 pb-7">
        <p className="font-body text-[11px] text-muted-foreground">
          Share of attributed sales by ad-type combination on the path to purchase. Select a slice or row
          for detail. Amazon does not report cost at path level.
        </p>
      </div>
      {/* Slide footer bar — same treatment as every other report slide */}
      <div className="flex items-center justify-between px-6 py-3 bg-primary">
        <span className="font-display font-bold text-[11px] uppercase tracking-[0.2em] text-primary-foreground">
          Strategic Insight Deck
        </span>
        <span className="font-display font-extrabold text-sm text-primary-foreground">{num}</span>
      </div>
    </motion.section>
  );
};

export default ConversionPathSection;
