import SectionWrapper from "./SectionWrapper";
import IconHalo from "./IconHalo";
import { Globe, Calendar, Flag, GraduationCap, Rocket, Shield } from "lucide-react";
import { motion } from "framer-motion";

const perks = [
  { icon: Globe, title: "Remote Work", desc: "Work from anywhere in the world — we're fully remote, year-round." },
  { icon: Calendar, title: "Generous PTO", desc: "Time off when you need it, so you come back refreshed and energized." },
  { icon: Flag, title: "Competitive Pay", desc: "We know you're valuable — our compensation reflects that." },
  { icon: GraduationCap, title: "Continuous Education", desc: "Become a lifelong learner with budget for courses, conferences, and growth." },
  { icon: Rocket, title: "Health Benefits", desc: "Because your health comes first — we've got you covered." },
  { icon: Shield, title: "Career Growth", desc: "Clear progression paths in a fast-growing Inc. 5000 company." },
];

const PerksSection = () => (
  <SectionWrapper>
    <h2 className="section-heading text-center mb-5">
      Perks & <span className="text-primary">Benefits</span>
    </h2>
    <p className="section-subheading text-center mb-16 max-w-2xl mx-auto">
      Enjoy remote flexibility, competitive pay, growth opportunities, and a supportive team culture designed to help you thrive.
    </p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {perks.map((p, i) => (
        <motion.div
          key={p.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="bg-card rounded-2xl p-8 shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
        >
          <IconHalo><p.icon className="w-6 h-6" /></IconHalo>
          <h3 className="text-lg font-display font-bold mb-2">{p.title}</h3>
          <p className="text-muted-foreground font-body text-sm leading-relaxed">{p.desc}</p>
        </motion.div>
      ))}
    </div>
  </SectionWrapper>
);

export default PerksSection;
