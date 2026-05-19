import { motion } from "framer-motion";
import { Lightbulb, Layers, ArrowRight, Radio, Target, Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import type { ExposureGroupChartData } from "@/lib/chart-data";
import type { SectionAnalysis } from "@/lib/analysis-engine";
import MissingSectionCard from "./MissingSectionCard";

interface ExposureGroupSectionProps {
  chartData: ExposureGroupChartData[] | null;
  analysis: SectionAnalysis;
}

const COLORS = [
  "hsl(25, 100%, 50%)",
  "hsl(220, 70%, 50%)",
  "hsl(142, 76%, 36%)",
  "hsl(280, 60%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
];

const ExposureGroupSection = ({ chartData, analysis }: ExposureGroupSectionProps) => {
  if (!analysis.available) {
    return <MissingSectionCard title="DSP + Sponsored Ads Interaction" missingDataset={analysis.unavailableReason || "DSP + Sponsored Ads interaction analysis unavailable."} />;
  }

  const insight = analysis.insights[0];

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Section 02</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>
        <h2 className="font-display font-extrabold text-3xl uppercase tracking-tight mb-2">
          Channel Interaction
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-2xl">
          Are dual-channel users converting better than single-channel? The evidence and strategic interpretation below.
        </p>
      </div>

      {/* DSP → SA → Combined Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Radio className="w-6 h-6 text-primary" />
          </div>
          <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-1">DSP</p>
          <p className="font-display font-extrabold text-sm">Discovery & Consideration</p>
          <p className="font-body text-xs text-muted-foreground mt-2">Builds awareness, drives product page visits, creates familiarity before intent forms</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-1">Sponsored Ads</p>
          <p className="font-display font-extrabold text-sm">Intent Capture</p>
          <p className="font-body text-xs text-muted-foreground mt-2">Converts demand that upper-funnel media helped create through search and product targeting</p>
        </div>
        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <p className="font-display font-bold text-xs uppercase tracking-widest text-primary mb-1">Combined</p>
          <p className="font-display font-extrabold text-sm">Stronger Conversion Readiness</p>
          <p className="font-body text-xs text-muted-foreground mt-2">Users exposed to both channels convert at materially higher rates — this is reinforcement, not overlap</p>
        </div>
      </motion.div>

      {/* Conversion Rate Bar Chart */}
      {chartData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">
            Conversion Rate by Exposure Group
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} formatter={(val: number) => [`${val.toFixed(2)}%`, 'Conv Rate']} />
                <Bar dataKey="convRate" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                  <LabelList dataKey="convRate" position="top" formatter={(v: number) => `${v.toFixed(2)}%`} className="fill-foreground font-display font-bold" style={{ fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Two-Column: Evidence + Interpretation */}
      {insight && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Evidence Signals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
          >
            <div className="flex items-center gap-2 mb-5">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Evidence Signals
              </h3>
            </div>
            <div className="space-y-4">
              {insight.observations.map((obs, i) => (
                <div key={i} className="bg-muted/30 rounded-xl p-4">
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{obs}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Strategic Interpretation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* So What Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">
                  What This Means
                </span>
              </div>
              <p className="font-body text-sm text-foreground leading-relaxed">
                {insight.soWhat}
              </p>
            </div>

            {/* Recommended Action Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm border-l-4 border-l-primary">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Recommended Action
                </span>
              </div>
              <p className="font-body text-sm font-medium text-foreground leading-relaxed">
                {insight.recommendation}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lift Table — compact */}
      {chartData && chartData.some(g => g.liftVsSponsoredOnly !== undefined || g.liftVsDspOnly !== undefined) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
        >
          <div className="px-5 py-3 bg-muted/30 border-b border-border">
            <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Lift vs Baselines
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/20">
                  <th className="text-left px-4 py-3 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Group</th>
                  <th className="text-right px-4 py-3 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Conv Rate</th>
                  <th className="text-right px-4 py-3 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">vs SA-Only</th>
                  <th className="text-right px-4 py-3 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">vs DSP-Only</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((g, i) => (
                  <tr key={g.name} className={i % 2 === 0 ? '' : 'bg-muted/10'}>
                    <td className="px-4 py-2.5 font-display font-bold text-xs">{g.name}</td>
                    <td className="px-4 py-2.5 text-right font-display font-bold text-xs">{g.convRate.toFixed(2)}%</td>
                    <td className="px-4 py-2.5 text-right font-body text-xs">
                      {g.liftVsSponsoredOnly !== undefined ? (
                        <span className={g.liftVsSponsoredOnly > 0 ? 'text-green-600 font-bold' : g.liftVsSponsoredOnly < 0 ? 'text-red-500' : ''}>
                          {g.liftVsSponsoredOnly >= 0 ? '+' : ''}{g.liftVsSponsoredOnly.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-body text-xs">
                      {g.liftVsDspOnly !== undefined ? (
                        <span className={g.liftVsDspOnly > 0 ? 'text-green-600 font-bold' : g.liftVsDspOnly < 0 ? 'text-red-500' : ''}>
                          {g.liftVsDspOnly >= 0 ? '+' : ''}{g.liftVsDspOnly.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExposureGroupSection;
