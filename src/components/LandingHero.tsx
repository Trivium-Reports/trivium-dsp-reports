import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap } from "lucide-react";

const pills = [
  { icon: BarChart3, label: "DSP Performance" },
  { icon: TrendingUp, label: "ROAS Analytics" },
  { icon: Zap, label: "Strategic Insights" },
];

const DecorativeChart = () => {
  const lines = [
    { points: "30,130 100,80 180,95 260,45 340,55 420,30", color: "hsl(25, 100%, 50%)", delay: 0 },
    { points: "30,160 100,115 180,105 260,70 340,50 420,65", color: "hsl(36, 92%, 55%)", delay: 0.15 },
    { points: "30,95 100,140 180,85 260,105 340,95 420,35", color: "hsl(15, 90%, 55%)", delay: 0.3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      className="relative flex-shrink-0 w-[280px] h-[280px] md:w-[300px] md:h-[300px] lg:w-[360px] lg:h-[360px]"
    >
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-[3px] border-border bg-card shadow-xl" />
      {/* Inner dark chart area */}
      <div className="absolute inset-3 rounded-full bg-foreground/95 overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 450 190"
          className="w-[90%] h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {[50, 80, 110, 140, 165].map((y) => (
            <line
              key={y}
              x1="15" y1={y} x2="435" y2={y}
              stroke="hsl(0, 0%, 25%)"
              strokeWidth="0.5"
            />
          ))}
          {lines.map((line, i) => (
            <motion.g key={i}>
              <motion.polyline
                points={line.points}
                fill="none"
                stroke={line.color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.7 + line.delay, ease: "easeInOut" }}
                style={{ strokeDasharray: 1200, strokeDashoffset: 0 }}
              />
              {line.points.split(" ").map((pt, j) => {
                const [cx, cy] = pt.split(",").map(Number);
                return (
                  <motion.circle
                    key={j}
                    cx={cx} cy={cy} r="5.5"
                    fill={line.color}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1.0 + line.delay + j * 0.08 }}
                  />
                );
              })}
            </motion.g>
          ))}
        </svg>
      </div>

      {/* Amazon DSP badge — top-right */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.6 }}
        className="absolute -top-3 -right-2 md:-right-4 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-md flex items-center gap-1.5"
      >
        <span className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-[11px] font-display font-bold uppercase tracking-wider text-foreground">
          Amazon DSP
        </span>
      </motion.div>

      {/* Sponsored Ads badge — bottom-left */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.8 }}
        className="absolute -bottom-3 -left-2 md:-left-4 px-3 py-1.5 rounded-full bg-card border border-border shadow-md flex items-center gap-1.5"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">
          Sponsored Ads
        </span>
      </motion.div>

      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl -z-10 scale-125" />
    </motion.div>
  );
};

interface LandingHeroProps {
  onViewReport: () => void;
  brandName?: string;
  dateRange?: string;
}

const LandingHero = ({ onViewReport, brandName, dateRange }: LandingHeroProps) => {
  return (
    <section className="relative min-h-[92vh] flex items-center px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 halo-glow opacity-40" />
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16">
          {/* Left: Text content */}
          <div className="flex-1 text-center md:text-left">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="uppercase tracking-[0.2em] text-sm font-display font-bold text-muted-foreground mb-4"
            >
              Biweekly Performance Intelligence
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="flex flex-wrap justify-center md:justify-start gap-2.5 mb-6"
            >
              {pills.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card text-foreground text-sm font-body font-medium shadow-sm border border-border"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  {label}
                </span>
              ))}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold uppercase tracking-tight leading-[1.05] mb-5"
            >
              Biweekly DSP{" "}
              <span className="text-primary">Performance Report</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 font-body leading-relaxed"
            >
              {brandName && dateRange
                ? `Executive-level DSP performance intelligence for ${brandName}. ${dateRange}.`
                : "Executive-level DSP performance insights, ROAS analysis, conversion funnel metrics, and strategic recommendations — delivered biweekly."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <button
                onClick={onViewReport}
                className="inline-flex items-center px-10 py-5 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                View Report
              </button>
            </motion.div>
          </div>

          {/* Right: Decorative chart */}
          <div className="flex items-center justify-center md:py-4">
            <DecorativeChart />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
