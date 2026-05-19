import { motion } from "framer-motion";
import { DollarSign, Paintbrush, Users } from "lucide-react";
import type { DeterministicRecommendation } from "@/lib/analysis-engine";

interface NextStepsSectionProps {
  recommendations: DeterministicRecommendation[];
}

interface ColumnDef {
  title: string;
  icon: typeof DollarSign;
  keywords: string[];
}

const COLUMNS: ColumnDef[] = [
  {
    title: "Budget & Delivery",
    icon: DollarSign,
    keywords: ['budget', 'spend', 'scale', 'cap', 'frequency', 'funnel', 'protect', 'reallocat', 'shift', 'roas', 'acos', 'delivery'],
  },
  {
    title: "Creative Strategy",
    icon: Paintbrush,
    keywords: ['creative', 'refresh', 'asset', 'ctr', 'engagement', 'messaging', 'copy', 'imagery'],
  },
  {
    title: "Audiences",
    icon: Users,
    keywords: ['audience', 'retarget', 'reach', 'prospecting', 'net-new', 'fresh', 'segment', 'exposure', 'user', 'converter', 'non-converter'],
  },
];

function categorize(rec: DeterministicRecommendation): number {
  const text = `${rec.title} ${rec.description}`.toLowerCase();
  let bestCol = 0;
  let bestScore = 0;
  COLUMNS.forEach((col, i) => {
    const score = col.keywords.filter(k => text.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCol = i;
    }
  });
  return bestCol;
}

const priorityStyles = {
  high: { dot: 'bg-red-500', label: 'High', bg: 'bg-red-50 border-red-200' },
  medium: { dot: 'bg-amber-500', label: 'Medium', bg: 'bg-amber-50 border-amber-200' },
  low: { dot: 'bg-green-500', label: 'Low', bg: 'bg-green-50 border-green-200' },
};

const NextStepsSection = ({ recommendations }: NextStepsSectionProps) => {
  const buckets: DeterministicRecommendation[][] = [[], [], []];
  for (const rec of recommendations) {
    buckets[categorize(rec)].push(rec);
  }

  const hasContent = buckets.some(b => b.length > 0);
  if (!hasContent) return null;

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Section 07</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>
        <h2 className="font-display font-extrabold text-3xl uppercase tracking-tight mb-2">
          Recommended Next Steps
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-2xl">
          Specific actions grounded in the data above — not generic best practices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col, colIdx) => {
          const Icon = col.icon;
          const items = buckets[colIdx];
          return (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: colIdx * 0.1 }}
              className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
            >
              <div className="p-5 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em]">
                    {col.title}
                  </h3>
                </div>
              </div>

              <div className="p-5">
                {items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map((rec, i) => {
                      const style = priorityStyles[rec.priority];
                      return (
                        <div key={i} className={`rounded-xl p-4 border ${style.bg}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                            <span className="font-display font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                              {style.label} Priority
                            </span>
                          </div>
                          <p className="font-display font-bold text-sm mb-1">{rec.title}</p>
                          <p className="font-body text-xs text-muted-foreground leading-relaxed">
                            {rec.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="font-body text-sm text-muted-foreground italic">
                    No specific actions surfaced from the current data in this area.
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NextStepsSection;
