import SectionWrapper from "./SectionWrapper";
import minaImg from "@/assets/mina-elias.webp";
import { motion } from "framer-motion";

const milestones = [
  { title: "Built His Brand", desc: "Investing his own resources and time as a chemical engineer, he crafted successful methods and strategies, eventually building a thriving seven-figure Amazon supplement brand." },
  { title: "Shared Knowledge", desc: "Driven by a desire to pay it forward, he shared insights on Amazon marketing through YouTube, Facebook groups, and podcasts. His expertise resonated with sellers worldwide — and Trivium was born." },
  { title: "Industry Leader", desc: "Trivium expanded rapidly. Mina's appearances on podcasts and international conferences solidified his status as one of the most recognized voices in the Amazon marketing space." },
];

const FounderSection = () => (
  <SectionWrapper>
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-10 p-10 md:p-16">
        <div className="relative shrink-0">
          <div className="absolute inset-0 halo-glow scale-[1.6] rounded-full" />
          <img
            src={minaImg}
            alt="Mina Elias, Founder of Trivium"
            className="relative w-52 h-52 md:w-64 md:h-64 rounded-full object-cover border-4 border-primary/20"
          />
        </div>
        <div>
          <p className="uppercase tracking-[0.15em] text-sm font-display font-bold text-primary mb-3">A Message from Our Founder</p>
          <h2 className="section-heading mb-3">Mina Elias</h2>
          <p className="text-muted-foreground font-body text-base leading-relaxed mb-6">
            "Working with the Trivium Team has been a fantastic and rewarding experience. Each day presents me with a new challenge. Those challenges become learning opportunities as I work with a bunch of talented people with an amazing passion for their work. I can't wait to hear from you!"
          </p>
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-4"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <span className="font-display font-bold text-foreground">{m.title}:</span>{" "}
                  <span className="text-muted-foreground font-body text-sm leading-relaxed">{m.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </SectionWrapper>
);

export default FounderSection;
