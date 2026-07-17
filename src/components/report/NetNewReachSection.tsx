import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, Users, Radio, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import type { NetNewReachRow } from "@/lib/chart-data";
import type { SectionAnalysis } from "@/lib/analysis-engine";
import MissingSectionCard from "./MissingSectionCard";

interface NetNewReachSectionProps {
  tableData: NetNewReachRow[] | null;
  analysis: SectionAnalysis;
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
};

const COLORS = [
  "hsl(25, 100%, 50%)",
  "hsl(220, 70%, 50%)",
  "hsl(142, 76%, 36%)",
  "hsl(280, 60%, 50%)",
  "hsl(38, 92%, 50%)",
];

const NetNewReachSection = ({ tableData, analysis }: NetNewReachSectionProps) => {
  if (!analysis.available || !tableData) {
    return <MissingSectionCard title="Net-New Reach" missingDataset={analysis.unavailableReason || "Net-new reach analysis unavailable."} />;
  }

  const insight = analysis.insights[0];

  // Aggregate summary metrics
  const totalReach = tableData.reduce((a, r) => a + r.reach, 0);
  const totalImpressions = tableData.reduce((a, r) => a + r.impressions, 0);
  const totalPurchasers = tableData.reduce((a, r) => a + r.purchasers, 0);
  const avgConvRate = totalReach > 0 ? (totalPurchasers / totalReach) * 100 : 0;
  const bestGroup = [...tableData].sort((a, b) => b.netNewConversionRate - a.netNewConversionRate)[0];
  const avgNNShare = tableData.length > 0 ? tableData.reduce((a, r) => a + r.netNewShare, 0) / tableData.length : 0;

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Section 06</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>
        <h2 className="font-display font-extrabold text-3xl uppercase tracking-tight mb-2">
          Net-New Reach
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-2xl">
          How effectively is each campaign group expanding the audience pool — and are those new users converting?
        </p>
      </div>

      {/* Prospecting Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Net-New Reach</p>
          </div>
          <p className="font-display font-extrabold text-2xl">{fmt(totalReach)}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">unique new users</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Avg NN Share</p>
          </div>
          <p className="font-display font-extrabold text-2xl">{avgNNShare.toFixed(1)}%</p>
          <p className="font-body text-xs text-muted-foreground mt-1">of total impressions</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-600" />
            <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">NN Conv Rate</p>
          </div>
          <p className="font-display font-extrabold text-2xl">{avgConvRate.toFixed(2)}%</p>
          <p className="font-body text-xs text-muted-foreground mt-1">purchase efficiency</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
          className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
          <p className="font-display font-bold text-[10px] uppercase tracking-widest text-primary mb-2">Top Converter</p>
          <p className="font-display font-extrabold text-lg text-primary">{bestGroup?.group || '—'}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">{bestGroup ? `${bestGroup.netNewConversionRate.toFixed(2)}% conv rate` : ''}</p>
        </motion.div>
      </div>

      {/* Reach Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      >
        <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">
          Net-New Reach by Campaign Group
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tableData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="group" tick={{ fontSize: 10 }} className="fill-muted-foreground" interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={fmt} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} formatter={(val: number) => [fmt(val), '']} />
              <Bar dataKey="reach" name="Net-New Reach" radius={[8, 8, 0, 0]}>
                {tableData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList dataKey="reach" position="top" formatter={fmt} style={{ fontSize: 10 }} className="fill-foreground font-display font-bold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Compact Detail Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
      >
        <div className="px-5 py-3 bg-muted/30 border-b border-border">
          <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Group Detail
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/20">
                <th className="text-left px-4 py-2.5 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Group</th>
                <th className="text-right px-3 py-2.5 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Reach</th>
                <th className="text-right px-3 py-2.5 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">NN Share</th>
                <th className="text-right px-3 py-2.5 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Purchasers</th>
                <th className="text-right px-3 py-2.5 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Conv Rate</th>
                <th className="text-right px-3 py-2.5 font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Avg Freq</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={row.group} className={i % 2 === 0 ? '' : 'bg-muted/10'}>
                  <td className="px-4 py-2 font-display font-bold text-xs">{row.group}</td>
                  <td className="px-3 py-2 text-right font-body">{fmt(row.reach)}</td>
                  <td className="px-3 py-2 text-right font-body">{row.netNewShare.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right font-body">{fmt(row.purchasers)}</td>
                  <td className="px-3 py-2 text-right font-body">{row.netNewConversionRate > 0 ? `${row.netNewConversionRate.toFixed(2)}%` : '—'}</td>
                  <td className="px-3 py-2 text-right font-body">{row.averageFrequency > 0 ? row.averageFrequency.toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Interpretation */}
      {insight && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">What This Means</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm border-l-4 border-l-primary">
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

export default NetNewReachSection;
