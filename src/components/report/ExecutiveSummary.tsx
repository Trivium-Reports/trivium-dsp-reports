import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, ShoppingCart, Users, Zap, Target,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "./KPICard";
import type { ExecutiveSummaryMetrics } from "@/lib/types";
import type { TrendPoint, StrategicInsightCard } from "@/lib/chart-data";

interface ExecutiveSummaryProps {
  metrics: ExecutiveSummaryMetrics;
  trendData: TrendPoint[] | null;
  insightCards: StrategicInsightCard[];
}

const fmt = (n: number, prefix = "", suffix = "") => {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K${suffix}`;
  return `${prefix}${n.toFixed(n % 1 === 0 ? 0 : 2)}${suffix}`;
};

const sentimentBorder = {
  positive: "border-l-green-600",
  neutral: "border-l-amber-500",
  warning: "border-l-red-500",
};

const sentimentIcons = {
  positive: <ArrowUpRight className="w-5 h-5 text-green-600" />,
  neutral: <Minus className="w-5 h-5 text-amber-500" />,
  warning: <ArrowDownRight className="w-5 h-5 text-red-500" />,
};

const ExecutiveSummary = ({ metrics, trendData, insightCards }: ExecutiveSummaryProps) => {
  const totalSpend = (metrics.dspSpend || 0) + (metrics.saSpend || 0);
  const totalSales = metrics.saSales || 0;
  const totalROAS = totalSpend > 0 && totalSales > 0 ? totalSales / totalSpend : undefined;

  const kpis = useMemo(() => {
    const cards: { label: string; value: string; icon: typeof DollarSign; subtitle?: string }[] = [];
    if (totalSpend > 0) cards.push({ label: "Total Spend", value: fmt(totalSpend, "$"), icon: DollarSign });
    if (totalSales > 0) cards.push({ label: "Total Sales", value: fmt(totalSales, "$"), icon: ShoppingCart });
    if (totalROAS !== undefined) cards.push({
      label: "Blended ROAS", value: `${totalROAS.toFixed(2)}x`, icon: TrendingUp,
      subtitle: totalROAS >= 3 ? "Strong" : totalROAS >= 1.5 ? "Moderate" : "Below target",
    });
    if (metrics.dspImpressions || metrics.saImpressions) {
      const totalImp = (metrics.dspImpressions || 0) + (metrics.saImpressions || 0);
      cards.push({ label: "Total Impressions", value: fmt(totalImp), icon: Users, subtitle: "across channels" });
    }
    return cards;
  }, [metrics, totalSpend, totalSales, totalROAS]);

  // "What matters most" summary
  const primarySignal = insightCards.length > 0 ? insightCards[0] : null;

  return (
    <div className="space-y-10">
      {/* Section Header — editorial style */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="h-px flex-1 bg-border" />
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Section 01
          </span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>
        <h2 className="font-display font-extrabold text-3xl uppercase tracking-tight mb-2">
          Executive Intelligence
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-2xl">
          Cross-channel performance at a glance. Every metric is computed directly from uploaded data.
        </p>
      </div>

      {/* Large KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} subtitle={kpi.subtitle} delay={i * 0.05} />
        ))}
      </div>

      {/* Channel Comparison Strip */}
      {metrics.dspSpend && metrics.saSpend && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* DSP Card */}
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(25, 100%, 50%)" }} />
              <span className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
                DSP Performance
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-body text-xs text-muted-foreground mb-1">Spend</p>
                <p className="font-display font-extrabold text-xl">{fmt(metrics.dspSpend, "$")}</p>
              </div>
              <div>
                <p className="font-body text-xs text-muted-foreground mb-1">Impressions</p>
                <p className="font-display font-extrabold text-xl">{fmt(metrics.dspImpressions || 0)}</p>
              </div>
              {metrics.dspCTR !== undefined && (
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">CTR</p>
                  <p className="font-display font-bold text-lg">{metrics.dspCTR.toFixed(2)}%</p>
                </div>
              )}
              {metrics.dspDPVR !== undefined && (
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">DPVR</p>
                  <p className="font-display font-bold text-lg">{metrics.dspDPVR.toFixed(2)}%</p>
                </div>
              )}
            </div>
          </div>
          {/* SA Card */}
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(220, 70%, 50%)" }} />
              <span className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
                Sponsored Ads Performance
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-body text-xs text-muted-foreground mb-1">Spend</p>
                <p className="font-display font-extrabold text-xl">{fmt(metrics.saSpend, "$")}</p>
              </div>
              <div>
                <p className="font-body text-xs text-muted-foreground mb-1">Sales</p>
                <p className="font-display font-extrabold text-xl">{fmt(metrics.saSales || 0, "$")}</p>
              </div>
              {metrics.saCTR !== undefined && (
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">CTR</p>
                  <p className="font-display font-bold text-lg">{metrics.saCTR.toFixed(2)}%</p>
                </div>
              )}
              {metrics.saROAS !== undefined && (
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">ROAS</p>
                  <p className="font-display font-bold text-lg">{metrics.saROAS.toFixed(2)}x</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* What Matters Most — hero strip */}
      {primarySignal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
        >
          <div className="bg-primary/5 px-6 py-3 border-b border-primary/10">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">
                What Matters Most
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="font-display font-extrabold text-4xl text-primary leading-none pt-1">
                {primarySignal.value}
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-sm mb-1">{primarySignal.title}</p>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {primarySignal.description}
                </p>
              </div>
              {sentimentIcons[primarySignal.sentiment]}
            </div>
          </div>
        </motion.div>
      )}

      {/* Strategic Signal Tiles */}
      {insightCards.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightCards.slice(1).map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className={`bg-card rounded-2xl p-5 shadow-sm border-l-4 border border-border ${sentimentBorder[card.sentiment]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Key Signal
                </span>
                {sentimentIcons[card.sentiment]}
              </div>
              <p className="font-display font-extrabold text-2xl tracking-tight mb-1">{card.value}</p>
              <p className="font-display font-bold text-xs mb-2">{card.title}</p>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Trend Chart */}
      {trendData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">
            Spend Trend
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="gradDsp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(25, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(25, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `$${fmt(v)}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  formatter={(val: number, name: string) => [`$${fmt(val)}`, name]}
                />
                <Legend />
                {trendData[0]?.dspSpend !== undefined && (
                  <Area type="monotone" dataKey="dspSpend" name="DSP Spend" stroke="hsl(25, 100%, 50%)" fill="url(#gradDsp)" strokeWidth={2} />
                )}
                {trendData[0]?.saSpend !== undefined && (
                  <Area type="monotone" dataKey="saSpend" name="SA Spend" stroke="hsl(220, 70%, 50%)" fill="url(#gradSa)" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Action Priority Strip */}
      {insightCards.some(c => c.sentiment === 'warning') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-red-600" />
            <span className="font-display font-bold text-[10px] uppercase tracking-[0.2em] text-red-600">
              Action Priority
            </span>
          </div>
          <p className="font-body text-sm text-foreground leading-relaxed">
            {insightCards.find(c => c.sentiment === 'warning')?.description}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ExecutiveSummary;
