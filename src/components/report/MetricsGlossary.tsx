import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, Layers, Info } from "lucide-react";
import {
  GLOSSARY_CATEGORIES,
  METRICS,
  EXPOSURE_GROUPS,
  EXPOSURE_INTERPRETATION,
  FUNNEL_STAGES,
  type MetricDefinition,
} from "@/lib/metrics-glossary";

const CategorySection = ({
  title,
  subtitle,
  metrics,
}: {
  title: string;
  subtitle: string;
  metrics: MetricDefinition[];
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-card hover:bg-muted/50 transition-colors text-left"
      >
        <div>
          <p className="font-display font-bold text-sm">{title}</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 space-y-3">
              {metrics.map((m) => (
                <div key={m.id} className="pl-3 border-l-2 border-primary/20">
                  <p className="font-display font-bold text-xs">{m.label}</p>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">
                    {m.description}
                  </p>
                  {m.interpretationRules.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {m.interpretationRules.map((rule, i) => (
                        <li
                          key={i}
                          className="font-body text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5"
                        >
                          <span className="text-primary mt-0.5">→</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MetricsGlossary = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-8 py-6 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-lg">
              Metrics Glossary & Interpretation Guide
            </h3>
            <p className="font-body text-sm text-muted-foreground">
              How the app interprets each upload and metric
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-8 space-y-6">
              {/* Exposure Group Logic */}
              <div className="bg-muted/40 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-primary" />
                  <p className="font-display font-bold text-sm">
                    Exposure Group / Interaction Logic
                  </p>
                </div>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                  {EXPOSURE_INTERPRETATION}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {EXPOSURE_GROUPS.map((g) => (
                    <div
                      key={g.key}
                      className="bg-background rounded-lg p-3 border border-border"
                    >
                      <p className="font-display font-bold text-xs">
                        {g.label}
                      </p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">
                        {g.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel Stage Labels */}
              <div className="bg-muted/40 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-primary" />
                  <p className="font-display font-bold text-sm">
                    Funnel Stage Interpretation
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FUNNEL_STAGES.map((s) => (
                    <div
                      key={s.key}
                      className="bg-background rounded-lg p-3 border border-border"
                    >
                      <p className="font-display font-bold text-xs">
                        {s.key} — {s.label}
                      </p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">
                        {s.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metric categories */}
              <div className="space-y-3">
                {GLOSSARY_CATEGORIES.map((cat) => {
                  const catMetrics = METRICS.filter(
                    (m) => m.category === cat.key
                  );
                  if (catMetrics.length === 0) return null;
                  return (
                    <CategorySection
                      key={cat.key}
                      title={cat.title}
                      subtitle={cat.subtitle}
                      metrics={catMetrics}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MetricsGlossary;
