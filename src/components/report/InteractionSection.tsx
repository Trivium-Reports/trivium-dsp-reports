import { motion } from "framer-motion";
import { Layers, Lightbulb, ArrowRight, Info } from "lucide-react";
import type { InteractionInsight } from "@/lib/interaction-engine";

interface InteractionSectionProps {
  insights: InteractionInsight[];
}

const InsightCard = ({ insight, index }: { insight: InteractionInsight; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className="bg-card rounded-2xl p-8 shadow-sm border border-border"
  >
    {/* Headline */}
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Layers className="w-5 h-5 text-primary" />
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

    {/* So What */}
    <div className="ml-[52px] bg-muted/50 rounded-xl p-5 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        <p className="font-display font-bold text-xs uppercase tracking-widest text-primary">
          So What?
        </p>
      </div>
      <p className="font-body text-sm text-foreground leading-relaxed">
        {insight.soWhat}
      </p>
    </div>

    {/* Recommendation */}
    <div className="ml-[52px] flex items-start gap-2">
      <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p className="font-body text-sm font-medium text-foreground leading-relaxed">
        {insight.recommendation}
      </p>
    </div>
  </motion.div>
);

const InteractionSection = ({ insights }: InteractionSectionProps) => (
  <div className="space-y-6">
    {insights.map((insight, i) => (
      <InsightCard key={i} insight={insight} index={i} />
    ))}
  </div>
);

export default InteractionSection;
