import { motion } from "framer-motion";
import { MapPin, Clock, DollarSign } from "lucide-react";

const pills = [
  { icon: MapPin, label: "Remote" },
  { icon: Clock, label: "Full-time" },
  { icon: DollarSign, label: "Competitive Salary" },
];

const HeroSection = () => {
  const scrollToApply = () => {
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[92vh] flex items-center px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 halo-glow opacity-40" />
      <div className="relative z-10 max-w-6xl mx-auto w-full text-center">
        <div className="max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="uppercase tracking-[0.2em] text-sm font-display font-bold text-muted-foreground mb-6"
          >
            We're Hiring
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {pills.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card text-foreground text-sm font-body font-medium shadow-sm border border-border"
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
            className="text-5xl sm:text-6xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[1.05] mb-8"
          >
            Join Trivium as an{" "}
            <span className="text-primary">Amazon PPC Strategist</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12 font-body leading-relaxed"
          >
            What's the best thing about working at Trivium? Easy. The people. We're curious, creative, and driven — building awesome stuff that helps brands grow, and loving every minute of it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button
              onClick={scrollToApply}
              className="inline-flex items-center px-10 py-5 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Apply Now
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
