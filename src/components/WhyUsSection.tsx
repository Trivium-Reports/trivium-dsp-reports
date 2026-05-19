import SectionWrapper from "./SectionWrapper";
import IconHalo from "./IconHalo";
import { Settings2, Map, DollarSign, Package, MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Settings2, title: "Always Give Value", desc: "Everything we do gets better when we ask 'how can we add more value?' — for our clients, our teammates, and ourselves." },
  { icon: Map, title: "Progress Over Perfection", desc: "We don't wait until things are flawless. We move fast, improve constantly, and build momentum. Progress is the goal." },
  { icon: DollarSign, title: "1% Better Every Day", desc: "Small improvements done consistently drive massive change. We aim to get just 1% better every day — in our work, our thinking, and how we show up." },
  { icon: Package, title: "Full Accountability & Ownership", desc: "We take full ownership. Every challenge is a chance to ask 'what could we have done better?' That mindset drives learning and long-term success." },
  { icon: MessageCircle, title: "Fail Fast, Fail Forward", desc: "We're not afraid to make mistakes, as long as we learn. We move fast, analyze what went wrong, adjust, and keep going." },
  { icon: User, title: "Focus on Solutions", desc: "Problems will always show up. What sets us apart is how we respond — we focus on fixing, improving, and finding the way forward." },
];

const WhyUsSection = () => (
  <SectionWrapper>
    <h2 className="section-heading text-center mb-5">
      The Trivium <span className="text-primary">Way</span>
    </h2>
    <p className="section-subheading text-center mb-16 max-w-2xl mx-auto">
      Our core values aren't just words on a wall — they're how we operate daily. This is the culture you'll be stepping into.
    </p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="bg-card rounded-2xl p-10 shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
        >
          <IconHalo><f.icon className="w-7 h-7" /></IconHalo>
          <h3 className="text-xl font-display font-bold mb-3">{f.title}</h3>
          <p className="text-muted-foreground font-body leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  </SectionWrapper>
);

export default WhyUsSection;
