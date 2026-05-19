import { motion } from "framer-motion";
import { Lightbulb, Layers, ArrowRight, Zap } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend,
} from "recharts";
import type { ConverterMetric } from "@/lib/chart-data";
import type { SectionAnalysis } from "@/lib/analysis-engine";
import MissingSectionCard from "./MissingSectionCard";

interface PathToPurchaseSectionProps {
  chartData: ConverterMetric[] | null;
  analysis: SectionAnalysis;
}

const PathToPurchaseSection = ({ chartData, analysis }: PathToPurchaseSectionProps) => {
  if (!analysis.available || !chartData) {
    return <MissingSectionCard title="Path to Purchase" missingDataset={analysis.unavailableReason || "Path to purchase analysis unavailable."} />;
  }

  const insight = analysis.insights[0];
  const isCrossChannel = insight?.observations.some(o =>
    o.includes('cross-channel') || o.includes('DSP driving discovery') || o.includes('multi-touch path')
  ) ?? false;

  // Key depth metrics for visual cards
  const adProducts = chartData.find(m => m.shortLabel === 'Ad Products');
  const impressions = chartData.find(m => m.shortLabel === 'Impressions');
  const dpvs = chartData.find(m => m.shortLabel === 'DPVs');
  const productsViewed = chartData.find(m => m.shortLabel === 'Products Viewed');
  const days = chartData.find(m => m.shortLabel === 'Days');

  const keyMetrics = [adProducts, impressions, dpvs, productsViewed].filter(Boolean) as ConverterMetric[];

  // Normalize for radar
  const scaleMax = Math.max(
    ...keyMetrics.map(d => Math.max(d.converterVal, d.nonConverterVal)),
    1
  );
  const radarData = keyMetrics.map(d => ({
    metric: d.shortLabel,
    Converters: scaleMax > 0 ? (d.converterVal / scaleMax) * 100 : 0,
    "Non-Converters": scaleMax > 0 ? (d.nonConverterVal / scaleMax) * 100 : 0,
  }));

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Section 04</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>
        <h2 className="font-display font-extrabold text-3xl uppercase tracking-tight mb-2">
          Path to Purchase
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-2xl">
          Converters engage deeper across more touchpoints before buying. Here is exactly how the two groups compare.
        </p>
      </div>

      {/* Engagement Depth Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      >
        <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Engagement Depth Radar
        </h3>
        <p className="font-body text-xs text-muted-foreground mb-4">
          Converters vs non-converters across key engagement dimensions, normalized to a common scale.
        </p>
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid className="stroke-border" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fontWeight: 600 }} className="fill-foreground" />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar
                name="Converters"
                dataKey="Converters"
                stroke="hsl(25, 100%, 50%)"
                fill="hsl(25, 100%, 50%)"
                fillOpacity={0.25}
                strokeWidth={2.5}
              />
              <Radar
                name="Non-Converters"
                dataKey="Non-Converters"
                stroke="hsl(220, 70%, 50%)"
                fill="hsl(220, 70%, 50%)"
                fillOpacity={0.12}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
              <Legend
                wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Indexed Comparison Bars — visual summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      >
        <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
          Engagement Depth Index — Converters vs Non-Converters
        </h3>
        <div className="space-y-5">
          {keyMetrics.map((metric, i) => {
            const barWidth = Math.min(metric.index * 35, 100);
            const gapLabel = metric.index >= 2 ? 'Strong gap' : metric.index >= 1.3 ? 'Moderate gap' : 'Narrow';
            const gapColor = metric.index >= 2 ? 'text-primary font-bold' : metric.index >= 1.3 ? 'text-amber-600 font-bold' : 'text-muted-foreground';
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-sm">{metric.shortLabel}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-display font-extrabold text-lg ${gapColor}`}>{metric.index.toFixed(2)}x</span>
                    <span className={`text-xs ${gapColor}`}>{gapLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${barWidth}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.7 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, hsl(25, 100%, 50%), hsl(25, 100%, 60%))` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="font-body text-xs text-muted-foreground">
                    Converters: <span className="font-display font-bold text-foreground">{metric.converterVal.toFixed(1)}</span>
                  </span>
                  <span className="font-body text-xs text-muted-foreground">
                    Non-Converters: <span className="font-display font-bold text-foreground">{metric.nonConverterVal.toFixed(1)}</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Side-by-side metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {keyMetrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border"
          >
            <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              {metric.shortLabel}
            </p>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-body text-xs text-muted-foreground">Conv</span>
                <span className="font-display font-extrabold text-lg">{metric.converterVal.toFixed(1)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-body text-xs text-muted-foreground">Non</span>
                <span className="font-display font-bold text-sm text-muted-foreground">{metric.nonConverterVal.toFixed(1)}</span>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="font-display font-extrabold text-primary text-center">{metric.index.toFixed(2)}x</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Days to Purchase — if available */}
      {days && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl p-5 shadow-sm border border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Average Days to Purchase
              </p>
              <p className="font-body text-xs text-muted-foreground">
                Longer cycles indicate a considered purchase path — upper-funnel media has time to assist.
              </p>
            </div>
            <div className="text-right">
              <p className="font-display font-extrabold text-3xl">{days.converterVal.toFixed(1)}</p>
              <p className="font-body text-xs text-muted-foreground">days avg</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cross-Channel Signal Card */}
      {isCrossChannel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-3 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-xs uppercase tracking-[0.2em] text-primary">
                Cross-Channel Reinforcement Signal
              </span>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">DSP Role</p>
              <p className="font-body text-sm text-foreground leading-relaxed">
                Awareness and consideration support — builds familiarity and drives product page engagement before purchase intent forms.
              </p>
            </div>
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">Sponsored Ads Role</p>
              <p className="font-body text-sm text-foreground leading-relaxed">
                Intent capture — converts demand once it matures through search and product targeting.
              </p>
            </div>
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">Strategic Implication</p>
              <p className="font-body text-sm text-foreground leading-relaxed">
                The engagement gap confirms converters move through a multi-channel journey. Evaluate DSP on consideration depth, not last-touch ROAS alone.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Interpretation Cards */}
      {insight && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* So What */}
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
            <p className="font-body text-sm text-foreground leading-relaxed">{insight.soWhat}</p>
          </motion.div>

          {/* Recommended Action */}
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
            <p className="font-body text-sm font-medium text-foreground leading-relaxed">{insight.recommendation}</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PathToPurchaseSection;
