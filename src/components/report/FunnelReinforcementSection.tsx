import { motion } from "framer-motion";
import { ArrowDown, Radio, Target, Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import type { FunnelStageData } from "@/lib/chart-data";
import type { ExecutiveSummaryMetrics } from "@/lib/types";
import MissingSectionCard from "./MissingSectionCard";

interface FunnelReinforcementSectionProps {
  funnelData: FunnelStageData[] | null;
  hasDsp?: boolean;
  hasSa?: boolean;
  metrics?: ExecutiveSummaryMetrics;
}

const STAGE_COLORS: Record<string, string> = {
  TOF: "hsl(220, 70%, 50%)",
  MOF: "hsl(280, 60%, 50%)",
  BOF: "hsl(25, 100%, 50%)",
  Sponsored: "hsl(142, 76%, 36%)",
  DSP: "hsl(25, 100%, 50%)",
  "Sponsored Ads": "hsl(220, 70%, 50%)",
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  TOF: "Build awareness + drive net-new reach",
  MOF: "Capture consideration + retarget engaged users",
  BOF: "Convert high-intent audiences",
  Sponsored: "Harvest demand through search + product targeting",
};

const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const FunnelReinforcementSection = ({ funnelData, hasDsp, hasSa, metrics }: FunnelReinforcementSectionProps) => {
  const hasMappedFunnel = !!funnelData;
  const hasChannelData = !!hasDsp || !!hasSa;

  // True empty state: no funnel data AND no channel data at all
  if (!hasMappedFunnel && !hasChannelData) {
    return <MissingSectionCard title="Funnel Reinforcement" missingDataset="DSP or Sponsored Ads campaign data required to infer funnel structure." />;
  }

  // Section header (shared)
  const header = (
    <div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-display font-bold text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Section 03</span>
        <div className="h-px flex-1 bg-border" />
      </motion.div>
      <h2 className="font-display font-extrabold text-3xl uppercase tracking-tight mb-2">
        Funnel Reinforcement
      </h2>
      <p className="font-body text-sm text-muted-foreground max-w-2xl">
        {hasMappedFunnel
          ? "How each funnel stage contributes to the overall strategy."
          : "Inferred from active DSP + Sponsored Ads channels and path-to-purchase engagement patterns."}
      </p>
    </div>
  );

  // ── INFERRED VIEW (no campaign mapping, but channel data exists) ──
  if (!hasMappedFunnel) {
    const dualChannel = !!hasDsp && !!hasSa;
    return (
      <div className="space-y-10">
        {header}

        {/* Channel Role Cards */}
        <div className={`grid grid-cols-1 ${dualChannel ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
          {hasDsp && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-card rounded-2xl p-5 shadow-sm border border-border border-l-4" style={{ borderLeftColor: "hsl(25, 100%, 50%)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-xs uppercase tracking-widest">DSP</p>
                  <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Discovery & Consideration</p>
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Builds awareness, drives product page visits, and creates familiarity before purchase intent forms.
              </p>
              {metrics?.dspSpend && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="font-body text-[10px] text-muted-foreground">Spend</p>
                    <p className="font-display font-extrabold text-lg">{fmt(metrics.dspSpend)}</p>
                  </div>
                  {metrics.dspImpressions && (
                    <div>
                      <p className="font-body text-[10px] text-muted-foreground">Impressions</p>
                      <p className="font-display font-bold text-sm">{fmt(metrics.dspImpressions)}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {hasSa && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-5 shadow-sm border border-border border-l-4" style={{ borderLeftColor: "hsl(220, 70%, 50%)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-display font-bold text-xs uppercase tracking-widest">Sponsored Ads</p>
                  <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Intent Capture</p>
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Converts demand that upper-funnel media helped create through search and product targeting.
              </p>
              {metrics?.saSpend && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="font-body text-[10px] text-muted-foreground">Spend</p>
                    <p className="font-display font-extrabold text-lg">{fmt(metrics.saSpend)}</p>
                  </div>
                  {metrics.saSales && (
                    <div>
                      <p className="font-body text-[10px] text-muted-foreground">Sales</p>
                      <p className="font-display font-bold text-sm">{fmt(metrics.saSales)}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {dualChannel && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-xs uppercase tracking-widest text-primary">Combined</p>
                  <p className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Funnel Reinforcement</p>
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground">
                The engagement pattern is consistent with a multi-stage journey across channels. This looks like cross-channel funnel reinforcement, even though campaign-level stage labels were not provided.
              </p>
            </motion.div>
          )}
        </div>

        {/* Inferred interpretation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <div className="space-y-3">
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Even without explicit funnel-stage mapping, the data suggests DSP is supporting discovery and consideration while Sponsored Ads captures intent closer to conversion.
            </p>
            {dualChannel && (
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                To unlock the full funnel-stage breakdown with TOF / MOF / BOF labels, use the Campaign Mapping step during upload to tag each campaign by its funnel role.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── MAPPED VIEW (campaign mapping present) ──
  return (
    <div className="space-y-10">
      {header}

      {/* Funnel Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {funnelData.map((stage, i) => (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div
              className="bg-card rounded-2xl p-5 shadow-sm border-l-4 h-full border border-border"
              style={{ borderLeftColor: STAGE_COLORS[stage.stage] || 'hsl(var(--border))' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-display font-bold text-white"
                  style={{ background: STAGE_COLORS[stage.stage] }}
                >
                  {stage.stage}
                </span>
                <span className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stage.role}
                </span>
              </div>
              <p className="font-body text-xs text-muted-foreground mb-4">
                {STAGE_DESCRIPTIONS[stage.stage] || ''}
              </p>
              <div className="space-y-2">
                <div>
                  <p className="font-body text-[10px] text-muted-foreground">Spend</p>
                  <p className="font-display font-extrabold text-lg">{fmt(stage.spend)}</p>
                </div>
                {stage.sales > 0 && (
                  <div>
                    <p className="font-body text-[10px] text-muted-foreground">Sales</p>
                    <p className="font-display font-bold text-sm">{fmt(stage.sales)}</p>
                  </div>
                )}
                {stage.roas > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="font-body text-[10px] text-muted-foreground">ROAS</p>
                    <p className="font-display font-extrabold text-primary">{stage.roas.toFixed(2)}x</p>
                  </div>
                )}
              </div>
            </div>
            {i < funnelData.length - 1 && (
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                <ArrowDown className="w-5 h-5 text-muted-foreground rotate-[-90deg]" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Spend vs ROAS Chart */}
      {funnelData.some(s => s.roas > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">
            Spend vs ROAS by Funnel Stage
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => fmt(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `${v.toFixed(1)}x`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Bar yAxisId="left" dataKey="spend" name="Spend" radius={[8, 8, 0, 0]} barSize={36}>
                  {funnelData.map((s) => (
                    <Cell key={s.stage} fill={STAGE_COLORS[s.stage] || 'hsl(var(--muted))'} opacity={0.7} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="roas" name="ROAS" radius={[8, 8, 0, 0]} barSize={36}>
                  {funnelData.map((s) => (
                    <Cell key={s.stage} fill={STAGE_COLORS[s.stage] || 'hsl(var(--muted))'} />
                  ))}
                  <LabelList dataKey="roas" position="top" formatter={(v: number) => `${v.toFixed(1)}x`} style={{ fontSize: 10 }} className="fill-foreground font-display font-bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="font-body text-xs text-muted-foreground mt-3 italic">
            TOF may show lower direct ROAS — evaluate on net-new reach, branded search lift, and PDP engagement rather than last-touch ROAS.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default FunnelReinforcementSection;
