import SectionWrapper from "./SectionWrapper";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Senior PPC Strategist",
    quote: "Trivium gave me the autonomy to own my accounts and the support system to grow. The challenges here become real learning opportunities every single day.",
  },
  {
    name: "Carlos M.",
    role: "PPC Analyst",
    quote: "The culture of pushing each other to get better is real. Every decision is data-driven, and you see the direct impact of your work on brands you care about.",
  },
  {
    name: "Priya D.",
    role: "Brand Manager",
    quote: "We've built an incredible network of people who inspire each other daily. Remote work, amazing teammates, and exciting brands — this is the last job I'll ever need.",
  },
];

const TestimonialsSection = () => (
  <SectionWrapper>
    <h2 className="section-heading text-center mb-16">
      What Our <span className="text-primary">Team</span> Says
    </h2>
    <div className="grid md:grid-cols-3 gap-8">
      {testimonials.map((t, i) => (
        <motion.div
          key={t.name}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="bg-card rounded-2xl p-10 shadow-sm flex flex-col hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
        >
          <Quote className="w-8 h-8 text-primary mb-6" />
          <p className="font-body text-foreground leading-relaxed flex-1 mb-8">"{t.quote}"</p>
          <div>
            <div className="font-display font-bold text-lg">{t.name}</div>
            <div className="text-sm text-muted-foreground font-body">{t.role}</div>
          </div>
        </motion.div>
      ))}
    </div>
  </SectionWrapper>
);

export default TestimonialsSection;
