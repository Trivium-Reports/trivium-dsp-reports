import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const troubleshootingItems = [
  "Widen the date range — narrow windows may exclude relevant activity.",
  "Reduce segmentation — too much granularity can trigger AMC privacy thresholds and suppress rows.",
  "Confirm that the AMC instance contains the required DSP and Sponsored Ads data sources.",
  "Confirm the selected campaigns actually delivered impressions in the chosen time period.",
  "Confirm the export came from the results grid, not the query instructions page.",
  "Confirm user-level identifiers are available where needed for the analysis.",
  "Confirm attribution window timing is sufficient — short windows may miss delayed conversions.",
];

interface AMCTroubleshooterProps {
  /** Render inline (no collapsible wrapper) for empty-state usage */
  inline?: boolean;
}

const ChecklistContent = () => (
  <div className="space-y-3">
    <p className="font-body text-sm text-muted-foreground leading-relaxed">
      No output found. Here are the most common reasons and what to try next.
    </p>
    <ul className="space-y-2">
      {troubleshootingItems.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-2.5 font-body text-sm text-muted-foreground leading-relaxed"
        >
          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-display font-bold text-muted-foreground flex-shrink-0 mt-0.5">
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const AMCTroubleshooter = ({ inline = false }: AMCTroubleshooterProps) => {
  const [open, setOpen] = useState(false);

  if (inline) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-primary" />
          <p className="font-display font-bold text-sm">
            Query isn't returning results?
          </p>
        </div>
        <ChecklistContent />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <p className="font-display font-bold text-sm">
            Query isn't returning results?
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
            <div className="px-5 pb-5 pt-1">
              <ChecklistContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AMCTroubleshooter;
