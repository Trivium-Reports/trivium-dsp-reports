import SectionWrapper from "./SectionWrapper";
import { Rocket } from "lucide-react";
import IconHalo from "./IconHalo";
import triviumTeam from "@/assets/trivium-team.webp";

const AboutSection = () => (
  <SectionWrapper>
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <IconHalo><Rocket className="w-8 h-8" /></IconHalo>
          <h2 className="section-heading mb-6">Join a Thriving Family</h2>
          <p className="text-muted-foreground font-body text-lg leading-relaxed mb-4">
            At Trivium, we believe the best job is one you love. We've created a culture where we push each other to get better and constantly challenge ourselves as individuals.
          </p>
          <p className="text-muted-foreground font-body leading-relaxed">
            Our team is built on trust, respect, open communication, and recognition for hard work. We're a verified Amazon Ads partner specializing in CPG, Health & Wellness, and Supplement brands — and we want you to be part of what we're building.
          </p>
        </div>
        <div className="relative min-h-[300px] md:min-h-0">
          <img
            src={triviumTeam}
            alt="The Trivium team"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  </SectionWrapper>
);

export default AboutSection;
