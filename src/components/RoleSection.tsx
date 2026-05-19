import SectionWrapper from "./SectionWrapper";
import { CheckCircle2 } from "lucide-react";

const responsibilities = [
  "Create and manage Amazon PPC campaigns (Sponsored Products, Brands, Display)",
  "Conduct in-depth keyword research and competitive analysis",
  "Build analytics reports and actionable performance dashboards",
  "Optimize budgets and bids to maximize profitability",
  "Perform Excel-based analysis and reporting for client accounts",
  "Communicate campaign performance and strategy to clients",
  "Collaborate with analysts, brand managers, and creative teams",
];

const requirements = [
  "3+ years of hands-on Amazon PPC experience",
  "Agency experience managing multiple brands simultaneously",
  "Experience managing medium to large advertising budgets",
  "Strong understanding of Amazon PPC and organic ranking dynamics",
  "English communication skills at B2 level or higher",
];

const CheckList = ({ items, title }: { items: string[]; title: string }) => (
  <div>
    <h3 className="text-2xl font-display font-bold uppercase tracking-tight mb-8">{title}</h3>
    <ul className="space-y-5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <span className="font-body text-foreground leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const RoleSection = () => (
  <SectionWrapper>
    <h2 className="section-heading mb-5">Your <span className="text-primary">Role</span></h2>
    <p className="section-subheading mb-16 max-w-3xl">
      As a PPC Manager & Analyst, you'll own Amazon advertising campaigns end-to-end — with the freedom to strategize, the data to back your decisions, and the support of an incredible team behind you.
    </p>
    <div className="grid md:grid-cols-2 gap-10">
      <div className="bg-card rounded-2xl p-10 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <CheckList title="Responsibilities" items={responsibilities} />
      </div>
      <div className="bg-card rounded-2xl p-10 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <CheckList title="Requirements" items={requirements} />
      </div>
    </div>
  </SectionWrapper>
);

export default RoleSection;
