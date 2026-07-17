import { motion } from "framer-motion";
import {
  DollarSign, Eye, MousePointerClick, ShoppingCart, TrendingUp, Users,
  BarChart3, Target, ArrowUpRight, ArrowDownRight, Activity,
  Zap, Calendar, Crosshair, Layers, RefreshCw, Award, Lightbulb,
  AlertTriangle, CheckCircle2, Search, Settings, Sparkles
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis, ComposedChart, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";
import type { DSPSummary } from "@/lib/dsp-data";

const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toFixed(0);
const fmtCurrency = (n: number) => `$${fmt(n)}`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

const COLORS = {
  primary: "hsl(25, 100%, 50%)",
  secondary: "hsl(36, 92%, 55%)",
  tertiary: "hsl(15, 90%, 55%)",
  success: "hsl(142, 76%, 36%)",
  muted: "hsl(0, 0%, 75%)",
  info: "hsl(210, 80%, 55%)",
  purple: "hsl(270, 70%, 55%)",
};

const TOOLTIP_STYLE = { borderRadius: '12px', border: '1px solid hsl(36,20%,85%)', fontSize: 12, background: 'white' };

/* ─── Shared Components ─── */

const Breadcrumb = ({ active }: { active: "discovery" | "analysis" | "insight" | "action" }) => {
  const steps = [
    { key: "discovery", icon: Search, label: "Discovery" },
    { key: "analysis", icon: Settings, label: "Analysis" },
    { key: "insight", icon: Lightbulb, label: "Insight" },
    { key: "action", icon: Zap, label: "Action" },
  ] as const;
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          {i > 0 && <span className="text-border mx-0.5">—</span>}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-display font-bold uppercase tracking-wider transition-all ${
            s.key === active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}>
            <s.icon className="w-3 h-3" />
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const SectionSlide = ({ children, num, className = "" }: { children: React.ReactNode; num: string; className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 60 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, ease: "easeOut" }}
    className={`bg-card rounded-2xl border border-border shadow-sm overflow-hidden ${className}`}
  >
    {children}
    <div className="flex items-center justify-between px-6 py-3 bg-primary">
      <span className="font-display font-bold text-[11px] uppercase tracking-[0.2em] text-primary-foreground">
        Strategic Insight Deck
      </span>
      <span className="font-display font-extrabold text-sm text-primary-foreground">{num}</span>
    </div>
  </motion.section>
);

/* Animated wrapper for child elements within slides */
const AnimIn = ({ children, delay = 0, className = "", direction = "up" }: { children: React.ReactNode; delay?: number; className?: string; direction?: "up" | "left" | "right" | "scale" }) => {
  const variants = {
    up: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 } },
    scale: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
  };
  return (
    <motion.div
      initial={variants[direction].initial}
      whileInView={variants[direction].animate}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};


const PriorityBadge = ({ level }: { level: "high" | "important" | "monitor" }) => {
  const styles = {
    high: "bg-primary text-primary-foreground",
    important: "bg-secondary text-secondary-foreground",
    monitor: "bg-muted text-foreground",
  };
  const labels = { high: "High Priority", important: "Important", monitor: "Monitor" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider ${styles[level]}`}>
      {labels[level]}
    </span>
  );
};

const KPICardLarge = ({ label, value, subtitle, icon: Icon, trend }: {
  label: string; value: string; subtitle: string; icon: any; trend?: string;
}) => (
  <div className="bg-card rounded-xl border border-border p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="font-display font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
    <p className="font-display font-extrabold text-3xl tracking-tight text-primary">{value}</p>
    <div className="flex items-center justify-between mt-1">
      <p className="font-body text-xs text-muted-foreground">{subtitle}</p>
      {trend && <span className="text-xs font-display font-bold text-primary">{trend}</span>}
    </div>
  </div>
);


/* ─── Main Report ─── */

interface DSPReportProps {
  data: DSPSummary;
}

const DSPReport = ({ data }: DSPReportProps) => {
  const shortDate = (d: string) => d.split(', ')[0] || d;

  const chartData = data.rows.map(r => ({
    date: shortDate(r.date),
    spend: r.spend,
    sales: r.sales,
    roas: r.sales / (r.spend || 1),
    impressions: r.impressions,
    ctr: r.ctr,
    purchases: r.purchases,
    ntbPurchases: r.ntbPurchases,
    dpv: r.dpv,
    atc: r.atc,
    ntbPercent: r.ntbPercent,
    ntbSales: r.ntbSales,
    dpvRate: r.dpv / (r.impressions || 1) * 100,
    atcRate: r.atc / (r.dpv || 1) * 100,
    purchaseRate: r.purchases / (r.atc || 1) * 100,
  }));

  // Computed
  const conversionRate = data.totalPurchases / (data.totalImpressions || 1) * 100;
  const dpvRate = data.totalDPV / (data.totalImpressions || 1) * 100;
  const atcRate = data.totalATC / (data.totalDPV || 1) * 100;
  const purchaseRate = data.totalPurchases / (data.totalATC || 1) * 100;
  const avgCPA = data.totalSpend / (data.totalPurchases || 1);
  const ntbCPA = data.totalSpend / (data.totalNTBPurchases || 1);
  const costPerDPV = data.totalSpend / (data.totalDPV || 1);

  const firstHalf = data.rows.slice(0, Math.ceil(data.rows.length / 2));
  const secondHalf = data.rows.slice(Math.ceil(data.rows.length / 2));
  const firstHalfROAS = firstHalf.reduce((s, r) => s + r.sales, 0) / firstHalf.reduce((s, r) => s + r.spend, 0);
  const secondHalfROAS = secondHalf.reduce((s, r) => s + r.sales, 0) / secondHalf.reduce((s, r) => s + r.spend, 0);
  const roasTrend = secondHalfROAS - firstHalfROAS;

  // Per-half rollups used by the visual-mode factual panels
  // ("Week 2" = second half of window, "Week 1" = first half).
  const aggHalf = (rows: typeof data.rows) => {
    const spend = rows.reduce((s, r) => s + r.spend, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const dpv = rows.reduce((s, r) => s + r.dpv, 0);
    const atc = rows.reduce((s, r) => s + r.atc, 0);
    const purchases = rows.reduce((s, r) => s + r.purchases, 0);
    const ntbPurchases = rows.reduce((s, r) => s + r.ntbPurchases, 0);
    const sales = rows.reduce((s, r) => s + r.sales, 0);
    const ntbSales = rows.reduce((s, r) => s + r.ntbSales, 0);
    return {
      spend, impressions, dpv, atc, purchases, ntbPurchases, sales, ntbSales,
      ctr: impressions > 0 ? rows.reduce((s, r) => s + r.ctr * r.impressions, 0) / impressions : 0,
      dpvRate: impressions > 0 ? (dpv / impressions) * 100 : 0,
      atcRate: dpv > 0 ? (atc / dpv) * 100 : 0,
      purchaseRate: atc > 0 ? (purchases / atc) * 100 : 0,
      ntbPercent: purchases > 0 ? (ntbPurchases / purchases) * 100 : 0,
      roas: spend > 0 ? sales / spend : 0,
      ntbCPA: ntbPurchases > 0 ? spend / ntbPurchases : 0,
      cpa: purchases > 0 ? spend / purchases : 0,
      costPerDPV: dpv > 0 ? spend / dpv : 0,
      dayCount: rows.length,
      startDate: rows[0]?.date ?? "",
      endDate: rows[rows.length - 1]?.date ?? "",
    };
  };
  const W1 = aggHalf(firstHalf);
  const W2 = aggHalf(secondHalf);
  // Delta = W2 - W1 for percentage-point metrics; for absolute numbers,
  // compute the caller-side pct change inline.
  const fmtDeltaPts = (a: number, b: number) => {
    const d = a - b;
    return `${d >= 0 ? "+" : ""}${d.toFixed(2)}`;
  };
  const fmtDeltaPct = (a: number, b: number) => {
    if (b === 0) return "—";
    const d = ((a - b) / b) * 100;
    return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
  };

  const bestDay = [...data.rows].sort((a, b) => b.sales - a.sales)[0];
  const worstDay = [...data.rows].sort((a, b) => a.sales - b.sales)[0];
  const bestROASDay = [...data.rows].sort((a, b) => (b.sales / (b.spend || 1)) - (a.sales / (a.spend || 1)))[0];

  // Day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowMap: Record<string, { spend: number; sales: number; count: number }> = {};
  data.rows.forEach(r => {
    const d = dayNames[new Date(r.date).getDay()];
    if (!dowMap[d]) dowMap[d] = { spend: 0, sales: 0, count: 0 };
    dowMap[d].spend += r.spend; dowMap[d].sales += r.sales; dowMap[d].count++;
  });
  const dowData = dayNames.map(d => ({
    day: d, avgSales: (dowMap[d]?.sales || 0) / (dowMap[d]?.count || 1),
    avgROAS: (dowMap[d]?.sales || 0) / (dowMap[d]?.spend || 1), count: dowMap[d]?.count || 0,
  })).filter(d => d.count > 0);
  const bestDow = dowData.reduce((a, b) => a.avgROAS > b.avgROAS ? a : b);
  const worstDow = dowData.reduce((a, b) => a.avgROAS < b.avgROAS ? a : b);

  // Cumulative
  let cumSpend = 0, cumSales = 0;
  const cumulativeData = data.rows.map(r => {
    cumSpend += r.spend; cumSales += r.sales;
    return { date: shortDate(r.date), cumSpend, cumSales, cumROAS: cumSales / cumSpend };
  });

  // Funnel
  const funnelData = [
    { name: "Impressions", value: data.totalImpressions },
    { name: "DPV", value: data.totalDPV },
    { name: "ATC", value: data.totalATC },
    { name: "Purchases", value: data.totalPurchases },
  ];

  // Radar
  const radarData = [
    { metric: "CTR", value: Math.min(data.avgCTR / 0.6 * 100, 100), benchmark: 60 },
    { metric: "DPV Rate", value: Math.min(dpvRate / 2.0 * 100, 100), benchmark: 60 },
    { metric: "ATC Rate", value: Math.min(atcRate / 15 * 100, 100), benchmark: 60 },
    { metric: "Purch. Rate", value: Math.min(purchaseRate / 45 * 100, 100), benchmark: 60 },
    { metric: "NTB %", value: Math.min(data.avgNTBPercent / 80 * 100, 100), benchmark: 60 },
    { metric: "ROAS", value: Math.min(data.overallROAS / 10 * 100, 100), benchmark: 60 },
  ];

  // NTB pies
  const ntbPurchPie = [
    { name: "New-to-Brand", value: data.totalNTBPurchases },
    { name: "Existing", value: data.totalPurchases - data.totalNTBPurchases },
  ];
  const ntbSalesPie = [
    { name: "NTB Sales", value: data.totalNTBSales },
    { name: "Existing Sales", value: data.totalSales - data.totalNTBSales },
  ];

  // Scatter
  const scatterData = data.rows.map(r => ({
    spend: r.spend, roas: r.sales / (r.spend || 1), sales: r.sales, date: shortDate(r.date),
  }));

  // Efficiency
  const avgCPC = data.totalSpend / (data.rows.reduce((s, r) => s + r.impressions * r.ctr / 100, 0) || 1);
  const costPerATC = data.totalSpend / (data.totalATC || 1);
  const effMetrics = [
    { label: "Cost per Click", value: `$${avgCPC.toFixed(2)}`, benchmark: "< $1.50", status: avgCPC < 1.5 ? "good" : avgCPC < 2.5 ? "ok" : "poor" as const },
    { label: "Cost per DPV", value: `$${costPerDPV.toFixed(2)}`, benchmark: "< $0.30", status: costPerDPV < 0.3 ? "good" : costPerDPV < 0.5 ? "ok" : "poor" as const },
    { label: "Cost per ATC", value: `$${costPerATC.toFixed(2)}`, benchmark: "< $2.00", status: costPerATC < 2.0 ? "good" : costPerATC < 3.5 ? "ok" : "poor" as const },
    { label: "Cost per Purchase", value: `$${avgCPA.toFixed(2)}`, benchmark: "< $5.00", status: avgCPA < 5.0 ? "good" : avgCPA < 8.0 ? "ok" : "poor" as const },
    { label: "NTB CPA", value: `$${ntbCPA.toFixed(2)}`, benchmark: "< $7.00", status: ntbCPA < 7.0 ? "good" : ntbCPA < 10.0 ? "ok" : "poor" as const },
    { label: "Overall ROAS", value: `${data.overallROAS.toFixed(2)}x`, benchmark: "> 7.0x", status: data.overallROAS > 7 ? "good" : data.overallROAS > 4 ? "ok" : "poor" as const },
  ];

  // Health score
  const healthScore = Math.round(
    (Math.min(data.overallROAS / 10, 1) * 30) +
    (Math.min(data.avgNTBPercent / 80, 1) * 25) +
    (Math.min(purchaseRate / 50, 1) * 25) +
    (Math.min(data.avgCTR / 0.6, 1) * 20)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ═══ SLIDE 01: Executive Intelligence Summary ═══ */}
      <SectionSlide num="01">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary mb-1">
                ── {data.dateRange.start} — {data.dateRange.end}
              </p>
              <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight">
                Executive Intelligence Summary
              </h2>
            </div>
            <Breadcrumb active="discovery" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Left: KPI Stack */}
            <div className="space-y-3">
              <AnimIn delay={0.1} direction="left"><KPICardLarge label="Ad Spend" value={fmtCurrency(data.totalSpend)} subtitle={`${fmtCurrency(data.avgDailySpend)}/day avg`} icon={DollarSign} /></AnimIn>
              <AnimIn delay={0.2} direction="left"><KPICardLarge label="Total Sales" value={fmtCurrency(data.totalSales)} subtitle={`${data.rows.length}-day period`} icon={TrendingUp} trend={`↗`} /></AnimIn>
              <AnimIn delay={0.3} direction="left"><KPICardLarge label="Total ROAS" value={`${data.overallROAS.toFixed(1)}`} subtitle="Return on ad spend" icon={Award} /></AnimIn>
              <AnimIn delay={0.4} direction="left"><KPICardLarge label="% New-to-Brand" value={`${data.avgNTBPercent.toFixed(0)}%`} subtitle={`${fmt(data.totalNTBPurchases)} NTB purchases`} icon={Users} /></AnimIn>
              <AnimIn delay={0.5} direction="left"><KPICardLarge label="Avg CTR" value={fmtPct(data.avgCTR)} subtitle="Click-through rate" icon={MousePointerClick} /></AnimIn>
            </div>

            {/* Right: Performance Trend Chart */}
            <AnimIn delay={0.2} direction="right">
              <div className="bg-background rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg uppercase tracking-tight">Bi-Weekly Performance Trends</h3>
                    <p className="font-body text-xs text-muted-foreground">Multi-Touch Attribution & Efficiency Tracking (Daily View)</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-display font-bold">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Sales ($)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-muted-foreground" /> Spend ($)</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="salesGradExec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} />
                    <YAxis yAxisId="sales" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
                    <YAxis yAxisId="spend" orientation="right" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Area yAxisId="sales" type="monotone" dataKey="sales" stroke={COLORS.primary} fill="url(#salesGradExec)" strokeWidth={3} name="Sales" animationDuration={1800} animationEasing="ease-in-out" />
                    <Line yAxisId="spend" type="monotone" dataKey="spend" stroke="hsl(0,0%,65%)" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Spend" animationDuration={2200} animationEasing="ease-in-out" />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Bottom insight pills */}
            </AnimIn>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 02: Daily ROAS & CTR Interaction ═══ */}
      <SectionSlide num="02">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">── Efficiency Tracking</p>
            <Breadcrumb active="analysis" />
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-6">
            ROAS & CTR Interaction
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-background rounded-xl border border-border p-5">
              <h3 className="font-display font-extrabold text-sm uppercase tracking-wide text-muted-foreground mb-4">Daily ROAS vs CTR Correlation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} />
                  <YAxis yAxisId="roas" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `${v.toFixed(1)}x`} />
                  <YAxis yAxisId="ctr" orientation="right" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Area yAxisId="roas" type="monotone" dataKey="roas" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.1} strokeWidth={3} name="ROAS" animationDuration={1800} animationEasing="ease-in-out" />
                  <Line yAxisId="ctr" type="monotone" dataKey="ctr" stroke={COLORS.info} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: COLORS.info, r: 3 }} name="CTR %" animationDuration={2200} animationEasing="ease-in-out" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {/* Week 2 values with delta vs Week 1 of the same 14-day
                  window. Numbers only, no interpretation. */}
              <div className="bg-background rounded-xl border border-border p-4">
                <h4 className="font-display font-extrabold text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
                  Metrics vs Previous Period
                </h4>
                <p className="font-body text-[10px] text-muted-foreground italic mb-3 leading-snug">
                  Week 2 shown; delta vs Week 1 of the reporting window.
                </p>
                <div className="space-y-2">
                  {[
                    { label: "ROAS",   value: `${W2.roas.toFixed(2)}x`,     delta: fmtDeltaPct(W2.roas, W1.roas) },
                    { label: "CTR",    value: fmtPct(W2.ctr),               delta: fmtDeltaPts(W2.ctr, W1.ctr) + " pts" },
                    { label: "Sales",  value: fmtCurrency(W2.sales),        delta: fmtDeltaPct(W2.sales, W1.sales) },
                    { label: "Spend",  value: fmtCurrency(W2.spend),        delta: fmtDeltaPct(W2.spend, W1.spend) },
                    { label: "Impressions", value: fmt(W2.impressions),     delta: fmtDeltaPct(W2.impressions, W1.impressions) },
                    { label: "Purchases",   value: fmt(W2.purchases),       delta: fmtDeltaPct(W2.purchases, W1.purchases) },
                  ].map(m => (
                    <div key={m.label} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 pb-1.5 border-b border-border last:border-b-0 last:pb-0">
                      <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</span>
                      <span className="font-display font-extrabold text-sm tabular-nums">{m.value}</span>
                      <span className={`font-body text-[10px] tabular-nums ${m.delta.startsWith("+") ? "text-emerald-600" : m.delta.startsWith("-") ? "text-red-600" : "text-muted-foreground"}`}>
                        {m.delta} vs W1
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 03: Conversion Funnel ═══ */}
      <SectionSlide num="03">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">── Full-Funnel Efficiency</p>
            <Breadcrumb active="analysis" />
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-6">
            Funnel Reinforcement
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              <div className="bg-background rounded-xl border border-border p-5">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide text-muted-foreground mb-4">Conversion Funnel Flow</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={fmt} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(0,0%,30%)', fontWeight: 700 }} width={100} />
                    <Tooltip formatter={(value: number) => fmt(value)} contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={1500} animationEasing="ease-out">
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={[COLORS.muted, COLORS.secondary, COLORS.tertiary, COLORS.primary][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Funnel rate cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background rounded-xl border border-border p-4 text-center">
                  <p className="font-display font-bold text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Impr → DPV</p>
                  <p className="font-display font-extrabold text-2xl text-primary">{fmtPct(dpvRate)}</p>
                  <p className="font-body text-[10px] text-muted-foreground">DPV Rate</p>
                </div>
                <div className="bg-background rounded-xl border border-border p-4 text-center">
                  <p className="font-display font-bold text-[9px] uppercase tracking-[0.15em] text-muted-foreground">DPV → ATC</p>
                  <p className="font-display font-extrabold text-2xl text-primary">{fmtPct(atcRate)}</p>
                  <p className="font-body text-[10px] text-muted-foreground">ATC Rate</p>
                </div>
                <div className="bg-background rounded-xl border border-border p-4 text-center">
                  <p className="font-display font-bold text-[9px] uppercase tracking-[0.15em] text-muted-foreground">ATC → Purchase</p>
                  <p className="font-display font-extrabold text-2xl text-primary">{fmtPct(purchaseRate)}</p>
                  <p className="font-body text-[10px] text-muted-foreground">Close Rate</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-background rounded-xl border border-border p-4 flex items-center gap-3">
                <Layers className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-display font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Top of Funnel</p>
                  <p className="font-display font-extrabold text-sm">BUILDS REACH</p>
                  <p className="font-body text-xs text-muted-foreground">New user acquisition</p>
                </div>
                <PriorityBadge level="high" />
              </div>
              <div className="flex justify-center"><span className="text-primary text-lg">↓</span></div>
              <div className="bg-background rounded-xl border border-border p-4 flex items-center gap-3">
                <Target className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-display font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Mid Funnel</p>
                  <p className="font-display font-extrabold text-sm">CAPTURES VALUE</p>
                  <p className="font-body text-xs text-muted-foreground">Consideration & Education</p>
                </div>
                <PriorityBadge level="important" />
              </div>
              <div className="flex justify-center"><span className="text-primary text-lg">↓</span></div>
              <div className="bg-background rounded-xl border border-border p-4 flex items-center gap-3">
                <Crosshair className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-display font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Bottom Funnel</p>
                  <p className="font-display font-extrabold text-sm">CONVERTS</p>
                  <p className="font-body text-xs text-muted-foreground">High-intent closing</p>
                </div>
                <PriorityBadge level="monitor" />
              </div>
            </div>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 04: Path to Purchase — Engagement Depth ═══ */}
      <SectionSlide num="04">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">── Journey Depth Diagnostics</p>
            <Breadcrumb active="analysis" />
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-6">
            Engagement Depth Radar
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-background rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide text-muted-foreground">Performance vs Benchmarks</h3>
                <div className="bg-foreground text-card px-3 py-1 rounded-lg font-display font-extrabold text-sm">
                  {healthScore}% <span className="font-normal text-xs ml-1">Health Score</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(36, 20%, 85%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: 'hsl(0,0%,30%)', fontWeight: 600 }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} strokeWidth={2.5} animationDuration={2000} animationEasing="ease-in-out" />
                  <Radar name="Benchmark" dataKey="benchmark" stroke={COLORS.muted} fill="none" strokeWidth={1.5} strokeDasharray="4 4" animationDuration={2500} animationEasing="ease-in-out" />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {/* Factual metric snapshot — Week 2 values with delta vs the
                  prior half of the reporting window. Numbers only, no
                  interpretation. Visible in both /full and /visual modes. */}
              <div className="bg-background rounded-xl border border-border p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <h4 className="font-display font-extrabold text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Metrics vs Previous Period
                  </h4>
                </div>
                <p className="font-body text-[10px] text-muted-foreground italic mb-3 leading-snug">
                  Week 2 shown; delta compares Week 2 vs Week 1 of the same 14-day window.
                </p>
                <div className="space-y-2">
                  {[
                    { label: "CTR",         value: fmtPct(W2.ctr),          delta: fmtDeltaPts(W2.ctr, W1.ctr) + " pts" },
                    { label: "DPV Rate",    value: fmtPct(W2.dpvRate),      delta: fmtDeltaPts(W2.dpvRate, W1.dpvRate) + " pts" },
                    { label: "ATC Rate",    value: fmtPct(W2.atcRate),      delta: fmtDeltaPts(W2.atcRate, W1.atcRate) + " pts" },
                    { label: "Purch. Rate", value: fmtPct(W2.purchaseRate), delta: fmtDeltaPts(W2.purchaseRate, W1.purchaseRate) + " pts" },
                    { label: "NTB %",       value: fmtPct(W2.ntbPercent),   delta: fmtDeltaPts(W2.ntbPercent, W1.ntbPercent) + " pts" },
                    { label: "ROAS",        value: `${W2.roas.toFixed(2)}x`, delta: fmtDeltaPct(W2.roas, W1.roas) },
                  ].map(m => (
                    <div key={m.label} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 pb-1.5 border-b border-border last:border-b-0 last:pb-0">
                      <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">
                        {m.label}
                      </span>
                      <span className="font-display font-extrabold text-sm tabular-nums">
                        {m.value}
                      </span>
                      <span className={`font-body text-[10px] tabular-nums ${m.delta.startsWith("+") ? "text-emerald-600" : m.delta.startsWith("-") ? "text-red-600" : "text-muted-foreground"}`}>
                        {m.delta} vs W1
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 05: NTB Deep Dive ═══ */}
      <SectionSlide num="05">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">── Prospecting Value Beyond Retargeting</p>
            <Breadcrumb active="insight" />
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-6">
            New-to-Brand Acquisition
          </h2>

          {/* Top KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-background rounded-xl border border-border p-4">
              <div className="flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="font-display font-bold text-[9px] uppercase tracking-wider text-muted-foreground">NTB Purchases</span>
              </div>
              <p className="font-display font-extrabold text-2xl">{fmt(data.totalNTBPurchases)}</p>
              <p className="font-body text-[11px] text-muted-foreground">{fmtPct(data.avgNTBPercent)} of total</p>
            </div>
            <div className="bg-background rounded-xl border border-border p-4">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                <span className="font-display font-bold text-[9px] uppercase tracking-wider text-muted-foreground">NTB Sales</span>
                <span className="text-[10px] font-display font-bold text-primary ml-auto">↗</span>
              </div>
              <p className="font-display font-extrabold text-2xl text-primary">{fmtCurrency(data.totalNTBSales)}</p>
              <p className="font-body text-[11px] text-muted-foreground">Incremental Revenue</p>
            </div>
            <div className="bg-background rounded-xl border border-border p-4">
              <div className="flex items-center gap-1 mb-1">
                <Crosshair className="w-3.5 h-3.5 text-primary" />
                <span className="font-display font-bold text-[9px] uppercase tracking-wider text-muted-foreground">NTB CPA</span>
              </div>
              <p className="font-display font-extrabold text-2xl">${ntbCPA.toFixed(2)}</p>
              <p className="font-body text-[11px] text-muted-foreground">Cost per new customer</p>
            </div>
            <div className="bg-foreground rounded-xl p-4">
              <p className="font-display font-bold text-[9px] uppercase tracking-wider text-card/70 mb-1">Prospecting Health</p>
              <p className="font-display font-extrabold text-xl text-card">{data.avgNTBPercent > 65 ? "EXCELLENT" : data.avgNTBPercent > 50 ? "GOOD" : "FAIR"}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-card/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(data.avgNTBPercent, 100)}%` }} />
                </div>
                <span className="text-xs font-display font-bold text-primary">{data.avgNTBPercent.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              {/* NTB Purchase vs Existing Pie */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl border border-border p-4">
                  <h3 className="font-display font-bold text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Purchase Split</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={ntbPurchPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" animationDuration={1600} animationBegin={200}>
                        <Cell fill={COLORS.primary} />
                        <Cell fill={COLORS.muted} />
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-background rounded-xl border border-border p-4">
                  <h3 className="font-display font-bold text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Revenue Split</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={ntbSalesPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" animationDuration={1600} animationBegin={400}>
                        <Cell fill={COLORS.success} />
                        <Cell fill={COLORS.muted} />
                      </Pie>
                      <Tooltip formatter={(value: number) => fmtCurrency(value)} contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NTB Daily Trend */}
              <div className="bg-background rounded-xl border border-border p-5">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide text-muted-foreground mb-3">NTB vs Existing Daily Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,40%)' }} />
                    <YAxis yAxisId="qty" tick={{ fontSize: 10, fill: 'hsl(0,0%,40%)' }} />
                    <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar yAxisId="qty" dataKey="purchases" fill={COLORS.muted} radius={[3, 3, 0, 0]} name="Total" animationDuration={1400} />
                    <Bar yAxisId="qty" dataKey="ntbPurchases" fill={COLORS.primary} radius={[3, 3, 0, 0]} name="NTB" animationDuration={1600} animationBegin={200} />
                    <Line yAxisId="pct" type="monotone" dataKey="ntbPercent" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 2 }} name="NTB %" animationDuration={2000} animationBegin={400} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              {/* Week 2 NTB values with delta vs Week 1. Numbers only. */}
              <div className="bg-background rounded-xl border border-border p-4">
                <h4 className="font-display font-extrabold text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
                  NTB vs Previous Period
                </h4>
                <p className="font-body text-[10px] text-muted-foreground italic mb-3 leading-snug">
                  Week 2 shown; delta vs Week 1 of the reporting window.
                </p>
                <div className="space-y-2">
                  {[
                    { label: "NTB Purchases", value: fmt(W2.ntbPurchases),       delta: fmtDeltaPct(W2.ntbPurchases, W1.ntbPurchases) },
                    { label: "NTB Sales",     value: fmtCurrency(W2.ntbSales),   delta: fmtDeltaPct(W2.ntbSales, W1.ntbSales) },
                    { label: "NTB %",         value: fmtPct(W2.ntbPercent),      delta: fmtDeltaPts(W2.ntbPercent, W1.ntbPercent) + " pts" },
                    { label: "NTB CPA",       value: `$${W2.ntbCPA.toFixed(2)}`, delta: fmtDeltaPct(W2.ntbCPA, W1.ntbCPA) },
                    { label: "Total Purchases", value: fmt(W2.purchases),        delta: fmtDeltaPct(W2.purchases, W1.purchases) },
                    { label: "Total Sales",     value: fmtCurrency(W2.sales),    delta: fmtDeltaPct(W2.sales, W1.sales) },
                  ].map(m => (
                    <div key={m.label} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 pb-1.5 border-b border-border last:border-b-0 last:pb-0">
                      <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</span>
                      <span className="font-display font-extrabold text-sm tabular-nums">{m.value}</span>
                      <span className={`font-body text-[10px] tabular-nums ${m.delta.startsWith("+") ? "text-emerald-600" : m.delta.startsWith("-") ? "text-red-600" : "text-muted-foreground"}`}>
                        {m.delta} vs W1
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 06: Day-of-Week Analysis ═══ */}
      <SectionSlide num="06">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">── Temporal Optimization</p>
            <Breadcrumb active="insight" />
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-6">
            Daily Performance
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              <div className="bg-background rounded-xl border border-border p-5">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide text-muted-foreground mb-3">Avg Sales & ROAS by Day</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={dowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 13, fill: 'hsl(0,0%,30%)', fontWeight: 700 }} />
                    <YAxis yAxisId="sales" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <YAxis yAxisId="roas" orientation="right" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `${v.toFixed(1)}x`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    <Bar yAxisId="sales" dataKey="avgSales" fill={COLORS.primary} radius={[6, 6, 0, 0]} name="Avg Sales ($)" animationDuration={1500} animationEasing="ease-out" />
                    <Line yAxisId="roas" type="monotone" dataKey="avgROAS" stroke={COLORS.success} strokeWidth={3} dot={{ fill: COLORS.success, r: 5 }} name="Avg ROAS" animationDuration={2200} animationBegin={300} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              {/* Factual day-of-week extremes — numbers only. */}
              <div className="bg-background rounded-xl border border-border p-4">
                <h4 className="font-display font-extrabold text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  Best & Worst Days
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 pb-1.5 border-b border-border">
                    <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">Best Day</span>
                    <span className="font-display font-extrabold text-sm">{bestDow.day}</span>
                    <span className="font-body text-[10px] text-muted-foreground tabular-nums">{bestDow.avgROAS.toFixed(2)}x</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 pb-1.5 border-b border-border">
                    <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">Best Avg Sales</span>
                    <span className="font-display font-extrabold text-sm tabular-nums">${bestDow.avgSales.toFixed(0)}</span>
                    <span className="font-body text-[10px] text-muted-foreground">{bestDow.day}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 pb-1.5 border-b border-border">
                    <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">Weakest Day</span>
                    <span className="font-display font-extrabold text-sm">{worstDow.day}</span>
                    <span className="font-body text-[10px] text-muted-foreground tabular-nums">{worstDow.avgROAS.toFixed(2)}x</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-baseline gap-3 pb-1.5 border-b border-border">
                    <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">ROAS Spread</span>
                    <span className="font-display font-extrabold text-sm tabular-nums">{(bestDow.avgROAS - worstDow.avgROAS).toFixed(2)}x</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-baseline gap-3">
                    <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">Days Covered</span>
                    <span className="font-display font-extrabold text-sm tabular-nums">{data.rows.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 07: Spend Efficiency ═══ */}
      <SectionSlide num="07">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">── Cost Efficiency Analysis</p>
            <Breadcrumb active="insight" />
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-6">
            Efficiency Scorecard
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              {/* Scorecard grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {effMetrics.map((m) => (
                  <div key={m.label} className="bg-background rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${m.status === 'good' ? 'bg-green-500' : m.status === 'ok' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <p className="font-display font-bold text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{m.label}</p>
                    </div>
                    <p className="font-display font-extrabold text-xl tracking-tight">{m.value}</p>
                    <p className="font-body text-[10px] text-muted-foreground mt-0.5">Target: {m.benchmark}</p>
                  </div>
                ))}
              </div>

              {/* Scatter */}
              <div className="bg-background rounded-xl border border-border p-5">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide text-muted-foreground mb-3">Daily Spend vs ROAS</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
                    <XAxis dataKey="spend" name="Spend" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <YAxis dataKey="roas" name="ROAS" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `${v.toFixed(1)}x`} />
                    <ZAxis dataKey="sales" range={[60, 300]} name="Sales" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={TOOLTIP_STYLE} />
                    <Scatter data={scatterData} fill={COLORS.primary} fillOpacity={0.7} animationDuration={1800} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-background rounded-xl border border-border p-4">
                <h4 className="font-display font-extrabold text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  Cost Metrics
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "CPA", value: `$${W2.cpa.toFixed(2)}`, delta: fmtDeltaPct(W2.cpa, W1.cpa) },
                    { label: "NTB CPA", value: `$${W2.ntbCPA.toFixed(2)}`, delta: fmtDeltaPct(W2.ntbCPA, W1.ntbCPA) },
                    { label: "Cost / DPV", value: `$${W2.costPerDPV.toFixed(2)}`, delta: fmtDeltaPct(W2.costPerDPV, W1.costPerDPV) },
                    { label: "ROAS", value: `${W2.roas.toFixed(2)}x`, delta: fmtDeltaPct(W2.roas, W1.roas) },
                    { label: "Spend", value: fmtCurrency(W2.spend), delta: fmtDeltaPct(W2.spend, W1.spend) },
                    { label: "Sales", value: fmtCurrency(W2.sales), delta: fmtDeltaPct(W2.sales, W1.sales) },
                  ].map(m => (
                    <div key={m.label} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 pb-1.5 border-b border-border last:border-b-0 last:pb-0">
                      <span className="font-display font-bold text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</span>
                      <span className="font-display font-extrabold text-sm tabular-nums">{m.value}</span>
                      <span className={`font-body text-[10px] tabular-nums ${m.delta.startsWith("+") ? "text-emerald-600" : m.delta.startsWith("-") ? "text-red-600" : "text-muted-foreground"}`}>
                        {m.delta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 08: Cumulative Performance ═══ */}
      <SectionSlide num="08">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">── Investment Tracking</p>
            <Breadcrumb active="discovery" />
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-6">
            Cumulative Spend & Sales
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-background rounded-xl border border-border p-5">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="cumSalesG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(0,0%,40%)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Area type="monotone" dataKey="cumSales" stroke={COLORS.success} fill="url(#cumSalesG)" strokeWidth={3} name="Cumulative Sales" animationDuration={2000} animationEasing="ease-in-out" />
                  <Area type="monotone" dataKey="cumSpend" stroke={COLORS.tertiary} fill="none" strokeWidth={2} strokeDasharray="6 4" name="Cumulative Spend" animationDuration={2400} animationBegin={300} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="bg-background rounded-xl border border-border p-5 text-center">
                <p className="font-display font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Net Revenue</p>
                <p className="font-display font-extrabold text-3xl text-primary">{fmtCurrency(data.totalSales - data.totalSpend)}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">Sales minus ad spend</p>
              </div>
              <div className="bg-background rounded-xl border border-border p-5 text-center">
                <p className="font-display font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Total Spend</p>
                <p className="font-display font-extrabold text-2xl">{fmtCurrency(data.totalSpend)}</p>
              </div>
              <div className="bg-background rounded-xl border border-border p-5 text-center">
                <p className="font-display font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Total Sales</p>
                <p className="font-display font-extrabold text-2xl">{fmtCurrency(data.totalSales)}</p>
              </div>
              <div className="bg-background rounded-xl border border-border p-5 text-center">
                <p className="font-display font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Period ROAS</p>
                <p className="font-display font-extrabold text-2xl text-primary">{data.overallROAS.toFixed(2)}x</p>
              </div>
            </div>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 09: Strategic Sprint Plan ═══ */}
      <SectionSlide num="09">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">── Strategic Sprint Plan</p>
            <div className="bg-background rounded-lg border border-border px-3 py-1.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="font-display font-bold text-xs">Next 14 Days</span>
            </div>
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight mb-2">
            Decision-Oriented Next Steps
          </h2>
          <div className="flex gap-2 mb-6">
            <div className="h-1.5 flex-1 bg-primary rounded-full" />
            <div className="h-1.5 flex-1 bg-primary rounded-full" />
            <div className="h-1.5 flex-1 bg-secondary rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Budget & Delivery */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="font-display font-extrabold text-sm uppercase">Budget & Delivery</h3>
                    <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Efficiency Controls</p>
                  </div>
                </div>
                <PriorityBadge level="high" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-body text-sm">Maintain current daily budget of <strong>{fmtCurrency(data.avgDailySpend)}</strong> — efficiency justifies the investment.</p>
                    <span className="inline-block mt-1 text-[10px] font-display font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">↗ +15% ROI Impact</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm">Redirect excess spend from low-ROAS days ({worstDow.day}) into <strong>Net-New Audiences</strong>.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm">Track <strong>Conv. Rate by Exposure</strong> frequency.</p>
                </div>
              </div>
              <div className="grid grid-cols-3">
                <div className="py-2 text-center bg-primary text-primary-foreground text-[10px] font-display font-bold">DAYS 1-3</div>
                <div className="py-2 text-center bg-primary/70 text-primary-foreground text-[10px] font-display font-bold">DAYS 4-7</div>
                <div className="py-2 text-center bg-primary/40 text-[10px] font-display font-bold">DAYS 8-14</div>
              </div>
            </div>

            {/* Creative Strategy */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="font-display font-extrabold text-sm uppercase">Creative Strategy</h3>
                    <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Messaging Flow</p>
                  </div>
                </div>
                <PriorityBadge level="important" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-body text-sm">Sequence by audience signals: Prospect → DPV Retarget → ATC Convert.</p>
                    <span className="inline-block mt-1 text-[10px] font-display font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">% +20% CTR Lift</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm">Refresh creative once users hit <strong>7-10 frequency</strong>.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm">Test <strong>lifestyle creative</strong> vs product-focused shots for TOF.</p>
                </div>
              </div>
              <div className="grid grid-cols-3">
                <div className="py-2 text-center bg-secondary text-secondary-foreground text-[10px] font-display font-bold">DAYS 1-3</div>
                <div className="py-2 text-center bg-secondary/70 text-[10px] font-display font-bold">DAYS 4-7</div>
                <div className="py-2 text-center bg-secondary/40 text-[10px] font-display font-bold">DAYS 8-14</div>
              </div>
            </div>

            {/* Audiences */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="font-display font-extrabold text-sm uppercase">Audiences</h3>
                    <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Growth & Tracking</p>
                  </div>
                </div>
                <PriorityBadge level="monitor" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-body text-sm">Activate <strong>Cross-Sell Segments</strong> for portfolio expansion.</p>
                    <span className="inline-block mt-1 text-[10px] font-display font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">$ LTV Growth</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm">Track <strong>Conv. Rate by Exposure</strong> to calibrate frequency caps.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-border mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm">Review <strong>"Net-New" acquisition CPA</strong> weekly.</p>
                </div>
              </div>
              <div className="grid grid-cols-3">
                <div className="py-2 text-center bg-muted text-[10px] font-display font-bold">DAYS 1-3</div>
                <div className="py-2 text-center bg-muted/70 text-[10px] font-display font-bold">DAYS 4-7</div>
                <div className="py-2 text-center bg-primary text-primary-foreground text-[10px] font-display font-bold">DAYS 8-14</div>
              </div>
            </div>
          </div>
        </div>
      </SectionSlide>

      {/* ═══ SLIDE 10: Daily Data Table ═══ */}
      <SectionSlide num="10">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary mb-1">── Raw Data</p>
              <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight">Daily Performance Data</h2>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-foreground">
                  {["Date", "Spend", "Impr.", "CTR", "DPV", "ATC", "Purch.", "NTB%", "Sales", "ROAS", "CPA"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-display font-bold text-[10px] uppercase tracking-[0.15em] text-card">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-primary/5 transition-colors`}>
                    <td className="px-4 py-2.5 font-body text-xs whitespace-nowrap font-medium">{shortDate(r.date)}</td>
                    <td className="px-4 py-2.5 font-body text-xs">${r.spend.toFixed(0)}</td>
                    <td className="px-4 py-2.5 font-body text-xs">{fmt(r.impressions)}</td>
                    <td className="px-4 py-2.5 font-body text-xs">{fmtPct(r.ctr)}</td>
                    <td className="px-4 py-2.5 font-body text-xs">{fmt(r.dpv)}</td>
                    <td className="px-4 py-2.5 font-body text-xs">{fmt(r.atc)}</td>
                    <td className="px-4 py-2.5 font-body text-xs">{r.purchases}</td>
                    <td className="px-4 py-2.5 font-body text-xs">{fmtPct(r.ntbPercent)}</td>
                    <td className="px-4 py-2.5 font-body text-xs font-semibold">${r.sales.toFixed(0)}</td>
                    <td className="px-4 py-2.5 font-body text-xs font-semibold text-primary">{(r.sales / r.spend).toFixed(2)}x</td>
                    <td className="px-4 py-2.5 font-body text-xs">${(r.spend / r.purchases).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionSlide>

      <footer className="py-8 text-center">
        <p className="text-muted-foreground font-body text-sm">
          © {new Date().getFullYear()} Trivium Group LLC. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default DSPReport;
