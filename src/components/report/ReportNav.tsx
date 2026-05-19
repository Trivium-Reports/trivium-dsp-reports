import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Layers, ArrowDown, Activity, Radio, Users, ListChecks, BookOpen,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: typeof BarChart3;
}

const NAV_ITEMS: NavItem[] = [
  { id: "section-executive", label: "Executive Summary", icon: BarChart3 },
  { id: "section-interaction", label: "DSP + SA Interaction", icon: Layers },
  { id: "section-funnel", label: "Funnel Reinforcement", icon: ArrowDown },
  { id: "section-path", label: "Path to Purchase", icon: Activity },
  { id: "section-frequency", label: "Optimal Frequency", icon: Radio },
  { id: "section-reach", label: "Net-New Reach", icon: Users },
  { id: "section-next-steps", label: "Next Steps", icon: ListChecks },
  { id: "section-glossary", label: "Glossary", icon: BookOpen },
];

const ReportNav = () => {
  const [activeId, setActiveId] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling past report header
      setIsVisible(window.scrollY > 300);

      // Find which section is in view
      let current = "";
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            current = item.id;
          }
        }
      }
      setActiveId(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!isVisible) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-1 print:hidden"
    >
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-2 shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              title={item.label}
              className={`group flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wide transition-all
                ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-200 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default ReportNav;
