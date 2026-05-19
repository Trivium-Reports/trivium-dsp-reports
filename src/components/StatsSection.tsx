import SectionWrapper from "./SectionWrapper";
import { motion } from "framer-motion";

const stats = [
  { value: "$24M+", label: "Managed Ad Spend Annually" },
  { value: "129%", label: "Avg. YOY Revenue Growth" },
  { value: "300+", label: "Brands Scaled on Amazon" },
  { value: "#170", label: "Inc. 5000 Fastest-Growing" },
];

const StatsSection = () => (
  <SectionWrapper>
    <h2 className="section-heading text-center mb-16">
      The Team You'll Be <span className="text-primary">Joining</span>
    </h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="bg-card rounded-2xl p-8 md:p-10 text-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300"
        >
          <div className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-primary mb-3">
            {s.value}
          </div>
          <div className="text-sm md:text-base text-muted-foreground font-body">{s.label}</div>
        </motion.div>
      ))}
    </div>
  </SectionWrapper>
);

export default StatsSection;
