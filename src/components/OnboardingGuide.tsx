import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  BarChart3,
  ShoppingCart,
  ChevronDown,
  CheckCircle,
  Circle,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Map,
  SkipForward,
} from "lucide-react";
import SectionWrapper from "./SectionWrapper";
import AMCTroubleshooter from "./AMCTroubleshooter";
import CampaignMappingTable, { type CampaignMapping } from "./CampaignMappingTable";
import type { ReportingWindow } from "@/lib/types";

interface OnboardingGuideProps {
  onContinue: (window: ReportingWindow, campaignMappings: CampaignMapping[]) => void;
}

const amcUseCases = [
  {
    title: "Compare purchase path of converters versus non-converters",
    usedFor: [
      "Journey depth diagnostics",
      "Exposure breadth",
      "Impressions per user",
      "Detail page views per user",
      "Products viewed per user",
      "Days to purchase",
    ],
  },
  {
    title: "Net-new reach by campaign group",
    usedFor: [
      "Prospecting value",
      "New audience reach",
      "Net-new purchase efficiency",
      "Net-new sales contribution",
    ],
  },
  {
    title: "Optimal frequency deep dive for on-Amazon and off-Amazon conversions",
    usedFor: [
      "Frequency cap strategy",
      "Saturation analysis",
      "Purchase rate by frequency bucket",
      "Branded search and PDP engagement by exposure depth",
    ],
  },
];

const dspFields = [
  "Campaign name",
  "Campaign ID",
  "Spend",
  "Impressions",
  "Clicks",
  "CTR",
  "Detail page view rate (if available)",
  "Purchases or sales (if available)",
];

const saFields = [
  "Campaign name",
  "Campaign ID",
  "Ad type",
  "Spend",
  "Impressions",
  "Clicks",
  "CTR",
  "Purchases or sales (if available)",
];

const OnboardingGuide = ({ onContinue }: OnboardingGuideProps) => {
  const today = new Date();
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() - 1);
  const defaultStart = new Date(defaultEnd);
  defaultStart.setDate(defaultStart.getDate() - 13);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(fmt(defaultStart));
  const [endDate, setEndDate] = useState(fmt(defaultEnd));
  const [isCustom, setIsCustom] = useState(false);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState<number | null>(0);
  const [campaignMappings, setCampaignMappings] = useState<CampaignMapping[]>([
    { campaignName: "", campaignId: "", label: "" },
  ]);

  const toggleStep = (i: number) => setExpanded(expanded === i ? null : i);
  const markDone = (i: number) => {
    setCompleted((p) => ({ ...p, [i]: true }));
    if (i < 3 && !completed[i + 1]) setExpanded(i + 1);
    else setExpanded(null);
  };

  const skipStep = (i: number) => {
    setCompleted((p) => ({ ...p, [i]: true }));
    if (i < 3 && !completed[i + 1]) setExpanded(i + 1);
    else setExpanded(null);
  };

  // Allow continue once at least one step is done (DSP or SA or AMC)
  const canContinue = Object.values(completed).some(Boolean);

  const handleContinue = () => {
    const filledMappings = campaignMappings.filter(
      (m) => m.campaignName && m.campaignId && m.label
    );
    onContinue({ startDate, endDate, isCustom }, filledMappings);
  };

  const stepMeta = [
    { icon: Database, title: "AMC Queries to Run", step: 1, skippable: true },
    { icon: BarChart3, title: "DSP Console Exports to Pull", step: 2, skippable: true },
    { icon: ShoppingCart, title: "Sponsored Ads Exports to Pull", step: 3, skippable: true },
    { icon: Map, title: "Campaign Mapping (Optional)", step: 4, skippable: true },
  ];

  return (
    <SectionWrapper>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="section-heading mb-4">
            Pull Your <span className="text-primary">Reports</span>
          </h2>
          <p className="section-subheading">
            Follow these steps to export the data you'll need. Skip any section you don't have access to — the report adapts automatically.
          </p>
        </motion.div>

        {/* Bi-weekly notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-primary/20 rounded-2xl p-6 mb-6 flex gap-4 items-start"
        >
          <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-bold text-sm uppercase tracking-wide mb-1">
              Important: Consistent Reporting Window
            </p>
            <p className="font-body text-muted-foreground text-sm leading-relaxed">
              This analyzer is built for bi-weekly reporting. Please pull all
              files for the same last 14 completed days unless you are
              intentionally analyzing a custom period.
            </p>
          </div>
        </motion.div>

        {/* Date range */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-8 mb-8 shadow-sm border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Reporting Window</h3>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!isCustom}
                onChange={() => { setIsCustom(false); setStartDate(fmt(defaultStart)); setEndDate(fmt(defaultEnd)); }}
                className="accent-primary"
              />
              <span className="font-body text-sm">Last 14 completed days (recommended)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={isCustom} onChange={() => setIsCustom(true)} className="accent-primary" />
              <span className="font-body text-sm">Custom range</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-display font-bold text-xs uppercase tracking-wide mb-2 text-muted-foreground">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!isCustom}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 transition-all" />
            </div>
            <div>
              <label className="block font-display font-bold text-xs uppercase tracking-wide mb-2 text-muted-foreground">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={!isCustom}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 transition-all" />
            </div>
          </div>
          <p className="mt-4 font-body text-xs text-muted-foreground">
            Your reporting window: <span className="font-semibold text-foreground">{startDate}</span> to{" "}
            <span className="font-semibold text-foreground">{endDate}</span>
          </p>
        </motion.div>

        {/* Step cards */}
        <div className="space-y-4">
          {stepMeta.map(({ icon: Icon, title, step, skippable }, i) => {
            const isOpen = expanded === i;
            const isDone = !!completed[i];

            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border"
              >
                {/* Step header */}
                <button
                  onClick={() => toggleStep(i)}
                  className="w-full flex items-center gap-4 p-6 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? "bg-primary/10" : "bg-muted"}`}>
                    {isDone ? (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    ) : (
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
                      Step {step}
                    </p>
                    <h3 className="font-display font-bold text-lg">{title}</h3>
                  </div>
                  {isDone && (
                    <span className="text-xs font-display font-bold uppercase tracking-wide text-primary">
                      Done
                    </span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Expandable content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 border-t border-border pt-5">
                        {i === 0 && <StepAMC />}
                        {i === 1 && <StepDSP />}
                        {i === 2 && <StepSA />}
                        {i === 3 && (
                          <CampaignMappingTable
                            mappings={campaignMappings}
                            onChange={setCampaignMappings}
                          />
                        )}

                        <div className="mt-6 flex items-center gap-3">
                          {i < 3 ? (
                            <>
                              <button
                                onClick={() => markDone(i)}
                                disabled={isDone}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                              >
                                {isDone ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" /> Completed
                                  </>
                                ) : (
                                  "I've Pulled This Report"
                                )}
                              </button>
                              {skippable && !isDone && (
                                <button
                                  onClick={() => skipStep(i)}
                                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full border border-border bg-background font-display font-bold text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  <SkipForward className="w-3.5 h-3.5" />
                                  Skip
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => markDone(i)}
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-background font-display font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors"
                            >
                              {isDone ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-primary" /> Saved
                                </>
                              ) : (
                                "Done Mapping"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Continue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            Continue to Upload
            <ArrowRight className="w-5 h-5" />
          </button>
          {!canContinue && (
            <p className="font-body text-xs text-muted-foreground mt-3">
              Complete or skip at least one step to continue.
            </p>
          )}
        </motion.div>
      </div>
    </SectionWrapper>
  );
};

/* ── Step content components ── */

const StepAMC = () => (
  <div className="space-y-5">
    <div className="bg-muted/40 rounded-xl p-4">
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        These are <span className="font-semibold text-foreground">AMC use case templates</span> —
        you don't need to write custom SQL. Navigate to AMC → Use Cases, run each
        query below, and export the results grid as CSV.
      </p>
    </div>

    {amcUseCases.map((uc, idx) => (
      <div key={idx} className="rounded-xl border border-border p-5">
        <h4 className="font-display font-bold text-sm mb-3 flex items-start gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5">
            {idx + 1}
          </span>
          {uc.title}
        </h4>
        <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 ml-8">
          Used for:
        </p>
        <ul className="ml-8 space-y-1.5">
          {uc.usedFor.map((item) => (
            <li key={item} className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <Circle className="w-2 h-2 text-primary flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ))}

    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <p className="font-display font-bold text-xs uppercase tracking-widest text-primary mb-2">
        About DSP + Sponsored Ads Interaction
      </p>
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        If you have an AMC exposure-group overlap query, upload it in the next step for the richest analysis. Otherwise, interaction insights will be derived automatically from your DSP and Sponsored Ads exports.
      </p>
    </div>

    <div className="bg-muted/40 rounded-xl p-4 space-y-2">
      <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
        Important notes
      </p>
      <ul className="space-y-1.5">
        {[
          "Export the output table as CSV for each use case.",
          "Date ranges should match across all exports.",
          "If multiple campaign groups are being analyzed, keep campaign scope consistent.",
          "If conversion lag is a concern, use the most recent completed 14-day window with stabilized attribution.",
        ].map((note) => (
          <li key={note} className="flex items-start gap-2 font-body text-sm text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            {note}
          </li>
        ))}
      </ul>
    </div>

    <AMCTroubleshooter />
  </div>
);

const StepDSP = () => (
  <div className="space-y-5">
    <p className="font-body text-sm text-muted-foreground leading-relaxed">
      Export DSP campaign performance for the same date range. This export powers
      top-line executive summary metrics for DSP.
    </p>
    <div className="rounded-xl border border-border p-5">
      <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Required fields
      </p>
      <ul className="space-y-2">
        {dspFields.map((field) => (
          <li key={field} className="flex items-center gap-2 font-body text-sm">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            {field}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const StepSA = () => (
  <div className="space-y-5">
    <p className="font-body text-sm text-muted-foreground leading-relaxed">
      Export Sponsored Ads campaign performance for the same date range. This
      export powers top-line executive summary metrics for Sponsored Ads.
    </p>
    <div className="rounded-xl border border-border p-5">
      <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Required fields
      </p>
      <ul className="space-y-2">
        {saFields.map((field) => (
          <li key={field} className="flex items-center gap-2 font-body text-sm">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            {field}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default OnboardingGuide;
