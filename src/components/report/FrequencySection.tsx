import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, Radio, TrendingDown, Target } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import type { FrequencyBandData } from "@/lib/chart-data";
import type { SectionAnalysis } from "@/lib/analysis-engine";
import MissingSectionCard from "./MissingSectionCard";

interface FrequencySectionProps {
  chartData: FrequencyBandData[] | null;
  analysis: SectionAnalysis;
}

const ZONE_COLORS = {
  building: { fill: "hsl(220, 70%, 50%)", bg: "rgba(59, 130, 246, 0.08)", label: "Building", icon: Radio },
  efficient: { fill: "hsl(142, 76%, 36%)", bg: "rgba(34, 197, 94, 0.08)", label: "Efficient", icon: Target },
  diminishing: { fill: "hsl(0, 84%, 60%)", bg: "rgba(239, 68, 68, 0.08)", label: "Diminishing", icon: TrendingDown },
};

const FrequencySection = ({ chartData, analysis }: FrequencySectionProps) => {
  if (!analysis.available || !chartData) {
    return <MissingSectionCard title="Optimal Frequency" missingDataset={analysis.unavailableReason || "Optimal frequency analysis unavailable."} />;
  }

  const insight = analysis.insights[0];

  const buildingEnd = chartData.findIndex(d => d.zone === 'efficient');
  const efficientEnd = chartData.findIndex(d => d.zone === 'diminishing');
  const peakIdx = chartData.reduce((best, d, i) => d.purchaseRate > chartData[best].purchaseRate ? i : best, 0);

  const peakBucket = chartData[peakIdx]?.bucket;
  const peakRate = chartData[peakIdx]?.purchaseRate;
  const efficientRange = buildingEnd >= 0 && efficientEnd > 0
    ? `${chartData[buildingEnd]?.bucket} – ${chartData[efficientEnd - 1]?.bucket}`
    : peakBucket || 'N/A';
  const wasteRange = efficientEnd > 0 ? `${chartData[efficientEnd]?.bucket}+` : 'N/A';
  const capBucket = efficientEnd > 0 ? chartData[efficientEnd - 1]?.bucket : peakBucket;

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Section 05</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>
        <h2 className="font-display font-extrabold text-3xl uppercase tracking-tight mb-2">
          Optimal Frequency
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-2xl">
          Where is each additional impression earning its keep — and where does it start turning into waste?
        </p>
      </div>

      {/* Frequency Band Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
          className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Peak Bucket</p>
          <p className="font-display font-extrabold text-2xl text-primary">{peakBucket || '—'}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">{peakRate ? `${peakRate.toFixed(3)}% purchase rate` : ''}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-5 shadow-sm border border-border border-l-4 border-l-green-600">
          <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Efficient Range</p>
          <p className="font-display font-extrabold text-2xl text-green-700">{efficientRange}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">Each impression earns its keep</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 shadow-sm border border-border border-l-4 border-l-red-500">
          <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Waste Zone</p>
          <p className="font-display font-extrabold text-2xl text-red-600">{wasteRange}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">Diminishing returns begin</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
          className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
          <p className="font-display font-bold text-[10px] uppercase tracking-widest text-primary mb-2">Recommended Cap</p>
          <p className="font-display font-extrabold text-2xl text-primary">{capBucket || '—'}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">Redirect budget past this point</p>
        </motion.div>
      </div>

      {/* Frequency Curve Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Purchase Rate Curve
          </h3>
          <div className="flex gap-3">
            {(Object.keys(ZONE_COLORS) as Array<keyof typeof ZONE_COLORS>).map(zone => (
              <div key={zone} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: ZONE_COLORS[zone].fill }} />
                <span className="font-body text-[10px] text-muted-foreground">{ZONE_COLORS[zone].label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(25, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(25, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              {buildingEnd > 0 && (
                <ReferenceArea x1={chartData[0].bucket} x2={chartData[buildingEnd - 1].bucket} fill={ZONE_COLORS.building.bg} />
              )}
              {buildingEnd >= 0 && efficientEnd > 0 && (
                <ReferenceArea x1={chartData[buildingEnd].bucket} x2={chartData[efficientEnd - 1].bucket} fill={ZONE_COLORS.efficient.bg} />
              )}
              {efficientEnd > 0 && (
                <ReferenceArea x1={chartData[efficientEnd].bucket} x2={chartData[chartData.length - 1].bucket} fill={ZONE_COLORS.diminishing.bg} />
              )}
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `${v.toFixed(2)}%`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                formatter={(val: number) => [`${val.toFixed(3)}%`, 'Purchase Rate']}
              />
              {capBucket && (
                <ReferenceLine x={capBucket} stroke="hsl(0, 84%, 60%)" strokeDasharray="5 5" label={{ value: 'Cap', position: 'top', fill: 'hsl(0, 84%, 60%)', fontSize: 10, fontWeight: 700 }} />
              )}
              <Area type="monotone" dataKey="purchaseRate" stroke="hsl(25, 100%, 50%)" fill="url(#freqGrad)" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(25, 100%, 50%)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Interpretation */}
      {insight && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">What This Means</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm border-l-4 border-l-primary"
          >
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">Recommended Action</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FrequencySection;
