import SectionWrapper from "./SectionWrapper";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const caseStudies = [
  { metric: "200%", desc: "Growth in ad revenue for Real Mushrooms through DSP advertising" },
  { metric: "75%", desc: "Increase in profits for MMA Nutrition with premium A+ content" },
  { metric: "61%", desc: "Growth in CTR for Organics Nature by optimizing main images" },
  { metric: "57%", desc: "Reduction in TACOS for Vitargo through tight keyword pruning" },
  { metric: "40K", desc: "More traffic to FitTea Amazon page from organic ranking" },
  { metric: "3X", desc: "Growth in revenue for Tenzo through creative advertising strategy" },
  { metric: "1.1M", desc: "New sessions for Labrada's new pro series from a well-planned launch" },
  { metric: "-20%", desc: "Reduction in ACOS for HappyV with PPC optimization analysis" },
];

const CaseStudiesSection = () => (
  <SectionWrapper>
    <h2 className="section-heading text-center mb-5">
      The Impact <span className="text-primary">You'll</span> Drive
    </h2>
    <p className="section-subheading text-center mb-16 max-w-2xl mx-auto">
      These are real results our strategists have delivered. At Trivium, your work directly moves the needle for brands — and you'll see the proof every day.
    </p>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {caseStudies.map((c, i) => (
        <motion.div
          key={c.metric + i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="bg-card rounded-2xl p-6 md:p-8 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-3xl md:text-4xl font-display font-extrabold text-primary">{c.metric}</span>
          </div>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">{c.desc}</p>
        </motion.div>
      ))}
    </div>
  </SectionWrapper>
);

export default CaseStudiesSection;
