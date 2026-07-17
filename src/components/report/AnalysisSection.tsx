import { motion } from "framer-motion";
import { Layers, Lightbulb, ArrowRight, Info, TrendingUp } from "lucide-react";
import type { SectionAnalysis } from "@/lib/analysis-engine";
import MissingSectionCard from "./MissingSectionCard";

interface AnalysisSectionProps {
  analysis: SectionAnalysis;
}

const AnalysisSection = ({ analysis }: AnalysisSectionProps) => {
  if (!analysis.available) {
    return (
      <MissingSectionCard
        title={analysis.title}
        missingDataset={analysis.unavailableReason || "Required dataset"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display font-extrabold text-xl uppercase tracking-tight">
        {analysis.title}
      </h3>

      {analysis.insights.map((insight, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1 }}
          className="bg-card rounded-2xl p-8 shadow-sm border border-border"
        >
          {/* Headline */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-display font-extrabold text-lg leading-snug pt-1.5">
              {insight.headline}
            </h4>
          </div>

          {/* Observations */}
          <div className="space-y-3 mb-6 ml-[52px]">
            {insight.observations.map((obs, i) => (
              <div key={i} className="flex items-start gap-2">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {obs}
                </p>
              </div>
            ))}
          </div>

          {/* AI commentary removed */}
        </motion.div>
      ))}
    </div>
  );
};

export default AnalysisSection;
