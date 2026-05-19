import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Building2 } from "lucide-react";
import SectionWrapper from "./SectionWrapper";
import MissingSectionCard from "./report/MissingSectionCard";
import MetricsGlossary from "./report/MetricsGlossary";
import ExecutiveSummary from "./report/ExecutiveSummary";
import ExposureGroupSection from "./report/ExposureGroupSection";
import FunnelReinforcementSection from "./report/FunnelReinforcementSection";
import PathToPurchaseSection from "./report/PathToPurchaseSection";
import FrequencySection from "./report/FrequencySection";
import NetNewReachSection from "./report/NetNewReachSection";
import NextStepsSection from "./report/NextStepsSection";
import ReportExportBar from "./report/ReportExportBar";
import ReportNav from "./report/ReportNav";
import { computeExecutiveSummary } from "@/lib/report-engine";
import { computeInteractionAnalysis } from "@/lib/interaction-engine";
import {
  analyzeConverters,
  analyzeFrequency,
  analyzeNetNewReach,
  analyzeExposureGroups,
  computeRecommendations,
} from "@/lib/analysis-engine";
import {
  extractTrendData,
  extractStrategicInsights,
  extractExposureChartData,
  extractFunnelData,
  extractConverterComparison,
  extractFrequencyBands,
  extractNetNewReachData,
} from "@/lib/chart-data";
import type { UploadSlot, ReportingWindow } from "@/lib/types";
import type { CampaignMapping } from "./CampaignMappingTable";

interface StrategicReportProps {
  slots: UploadSlot[];
  reportingWindow: ReportingWindow;
  campaignMappings: CampaignMapping[];
  brandName?: string;
  onReset: () => void;
}

const StrategicReport = ({ slots, reportingWindow, campaignMappings, brandName, onReset }: StrategicReportProps) => {
  const dspSlot = slots.find((s) => s.id === "dsp" && s.status === "valid");
  const saSlot = slots.find((s) => s.id === "sponsored-ads" && s.status === "valid");
  const ppSlot = slots.find((s) => s.id === "amc-converters" && s.status === "valid");
  const freqSlot = slots.find((s) => s.id === "amc-frequency" && s.status === "valid");
  const reachSlot = slots.find((s) => s.id === "amc-reach" && s.status === "valid");
  const interactionSlot = slots.find((s) => s.id === "amc-interaction" && s.status === "valid");

  const asStrings = (slot: UploadSlot | undefined) =>
    (slot?.data as Record<string, string>[] | null) ?? null;

  const dateRange = `${reportingWindow.startDate} — ${reportingWindow.endDate}`;

  // ── Executive Summary Metrics ──
  const metrics = useMemo(
    () => computeExecutiveSummary(
      asStrings(dspSlot), dspSlot?.columns ?? null,
      asStrings(saSlot), saSlot?.columns ?? null
    ),
    [dspSlot, saSlot]
  );

  // ── Trend Data ──
  const trendData = useMemo(
    () => extractTrendData(
      asStrings(dspSlot), dspSlot?.columns ?? null,
      asStrings(saSlot), saSlot?.columns ?? null
    ),
    [dspSlot, saSlot]
  );

  // ── Analysis Engines ──
  const convertersAnalysis = useMemo(
    () => analyzeConverters(asStrings(ppSlot), ppSlot?.columns ?? null, {
      hasDsp: !!dspSlot,
      hasSa: !!saSlot,
      campaignMappings,
    }),
    [ppSlot, dspSlot, saSlot, campaignMappings]
  );

  const frequencyAnalysis = useMemo(
    () => analyzeFrequency(asStrings(freqSlot), freqSlot?.columns ?? null),
    [freqSlot]
  );

  const reachAnalysis = useMemo(
    () => analyzeNetNewReach(asStrings(reachSlot), reachSlot?.columns ?? null, campaignMappings),
    [reachSlot, campaignMappings]
  );

  // Exposure group: use AMC interaction file if available, otherwise derive from interaction engine
  const exposureAnalysis = useMemo(() => {
    if (interactionSlot) {
      return analyzeExposureGroups(asStrings(interactionSlot), interactionSlot?.columns ?? null);
    }
    // Fallback: use interaction engine with DSP + SA + AMC data
    const interactionResult = computeInteractionAnalysis(
      asStrings(dspSlot), dspSlot?.columns ?? null,
      asStrings(saSlot), saSlot?.columns ?? null,
      asStrings(ppSlot), ppSlot?.columns ?? null,
      asStrings(freqSlot), freqSlot?.columns ?? null
    );
    // Map InteractionAnalysis to SectionAnalysis shape
    return {
      sectionId: 'exposure-group-analysis',
      title: 'DSP + Sponsored Ads Interaction',
      available: interactionResult.available,
      unavailableReason: interactionResult.unavailableReason,
      insights: interactionResult.insights.map(i => ({
        headline: i.headline,
        observations: i.observations,
        soWhat: i.soWhat,
        recommendation: i.recommendation,
      })),
    };
  }, [interactionSlot, dspSlot, saSlot, ppSlot, freqSlot]);

  const allAnalyses = useMemo(
    () => [convertersAnalysis, frequencyAnalysis, reachAnalysis, exposureAnalysis],
    [convertersAnalysis, frequencyAnalysis, reachAnalysis, exposureAnalysis]
  );

  // ── Chart Data ──
  const exposureChartData = useMemo(
    () => interactionSlot
      ? extractExposureChartData(asStrings(interactionSlot), interactionSlot?.columns ?? null)
      : null,
    [interactionSlot]
  );

  const funnelData = useMemo(
    () => extractFunnelData(
      asStrings(dspSlot), dspSlot?.columns ?? null,
      asStrings(saSlot), saSlot?.columns ?? null,
      campaignMappings
    ),
    [dspSlot, saSlot, campaignMappings]
  );

  const converterChartData = useMemo(
    () => extractConverterComparison(asStrings(ppSlot), ppSlot?.columns ?? null),
    [ppSlot]
  );

  const frequencyChartData = useMemo(
    () => extractFrequencyBands(asStrings(freqSlot), freqSlot?.columns ?? null),
    [freqSlot]
  );

  const netNewReachData = useMemo(
    () => extractNetNewReachData(asStrings(reachSlot), reachSlot?.columns ?? null),
    [reachSlot]
  );

  // ── Strategic Insights & Recommendations ──
  const insightCards = useMemo(
    () => extractStrategicInsights(metrics, allAnalyses),
    [metrics, allAnalyses]
  );

  const recommendations = useMemo(
    () => computeRecommendations(
      allAnalyses,
      asStrings(dspSlot), dspSlot?.columns ?? null,
      asStrings(saSlot), saSlot?.columns ?? null,
      campaignMappings
    ),
    [allAnalyses, dspSlot, saSlot, campaignMappings]
  );

  const hasSomeData = !!dspSlot || !!saSlot || !!ppSlot || !!freqSlot || !!reachSlot || !!interactionSlot;

  return (
    <div className="min-h-screen">
      {/* Section Anchor Nav */}
      <ReportNav />

      {/* ─── Summary Banner ─── */}
      <SectionWrapper className="!pt-8 !pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {brandName && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-display font-extrabold text-lg uppercase tracking-tight">
                    {brandName}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="font-body text-sm">{dateRange}</span>
              </div>
            </div>
            <button
              onClick={onReset}
              className="px-6 py-2.5 rounded-full border border-border bg-background font-display font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors print:hidden"
            >
              New Report
            </button>
          </div>
        </motion.div>

        {/* Report Title */}
        <div className="flex flex-col gap-4 mb-2">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="section-heading"
            >
              {brandName ? (
                <>{brandName} <span className="text-primary">Strategic Intelligence</span> Report</>
              ) : (
                <>Strategic <span className="text-primary">Intelligence</span> Report</>
              )}
            </motion.h1>
          </div>

          {/* Export Toolbar */}
          <ReportExportBar
            metrics={metrics}
            insightCards={insightCards}
            recommendations={recommendations}
            slots={slots}
            brandName={brandName}
            dateRange={dateRange}
          />
        </div>
      </SectionWrapper>

      {/* ─── 1. Executive Intelligence Summary ─── */}
      {hasSomeData ? (
        <SectionWrapper className="!pt-8" id="section-executive">
          <ExecutiveSummary metrics={metrics} trendData={trendData} insightCards={insightCards} />
        </SectionWrapper>
      ) : (
        <SectionWrapper className="!pt-8" id="section-executive">
          <MissingSectionCard title="Executive Intelligence Summary" missingDataset="At least one dataset upload is required to generate the executive summary." />
        </SectionWrapper>
      )}

      {/* ─── 2. DSP + Sponsored Ads Interaction ─── */}
      <SectionWrapper className="!pt-12" id="section-interaction">
        <ExposureGroupSection chartData={exposureChartData} analysis={exposureAnalysis} />
      </SectionWrapper>

      {/* ─── 3. Funnel Reinforcement ─── */}
      <SectionWrapper className="!pt-12" id="section-funnel">
        <FunnelReinforcementSection funnelData={funnelData} hasDsp={!!dspSlot} hasSa={!!saSlot} metrics={metrics} />
      </SectionWrapper>

      {/* ─── 4. Path to Purchase ─── */}
      <SectionWrapper className="!pt-12" id="section-path">
        <PathToPurchaseSection chartData={converterChartData} analysis={convertersAnalysis} />
      </SectionWrapper>

      {/* ─── 5. Optimal Frequency ─── */}
      <SectionWrapper className="!pt-12" id="section-frequency">
        <FrequencySection chartData={frequencyChartData} analysis={frequencyAnalysis} />
      </SectionWrapper>

      {/* ─── 6. Net-New Reach ─── */}
      <SectionWrapper className="!pt-12" id="section-reach">
        <NetNewReachSection tableData={netNewReachData} analysis={reachAnalysis} />
      </SectionWrapper>

      {/* ─── 7. Decision-Oriented Next Steps ─── */}
      {recommendations.length > 0 && (
        <SectionWrapper className="!pt-12" id="section-next-steps">
          <NextStepsSection recommendations={recommendations} />
        </SectionWrapper>
      )}

      {/* ─── Metrics Glossary ─── */}
      <SectionWrapper className="!pt-12 !pb-16" id="section-glossary">
        <MetricsGlossary />
      </SectionWrapper>
    </div>
  );
};

export default StrategicReport;
