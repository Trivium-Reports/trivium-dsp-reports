import SectionWrapper from "./SectionWrapper";
import { motion } from "framer-motion";

import xeela from "@/assets/brands/xeela.png";
import hrdwrk from "@/assets/brands/hrdwrk.png";
import neurogum from "@/assets/brands/neurogum.png";
import labrada from "@/assets/brands/labrada.png";
import mountainVoyage from "@/assets/brands/mountain-voyage.png";
import below60 from "@/assets/brands/below60.png";
import deenti from "@/assets/brands/deenti.png";
import happyv from "@/assets/brands/happyv.png";
import primalqueen from "@/assets/brands/primalqueen.png";
import puursmile from "@/assets/brands/puursmile.png";

const row1 = [
  { src: xeela, name: "Xeela" },
  { src: hrdwrk, name: "HRDWRK" },
  { src: neurogum, name: "Neuro Gum" },
  { src: labrada, name: "Labrada" },
  { src: mountainVoyage, name: "Mountain Voyage" },
];

const row2 = [
  { src: below60, name: "Below 60" },
  { src: deenti, name: "DeEnti" },
  { src: happyv, name: "Happy V" },
  { src: primalqueen, name: "Primal Queen" },
  { src: puursmile, name: "Puur Smile" },
];

const MarqueeRow = ({ brands, reverse = false }: { brands: typeof row1; reverse?: boolean }) => (
  <div className="relative overflow-hidden">
    <motion.div
      className="flex gap-6 w-max"
      animate={{ x: reverse ? [-1000, 0] : [0, -1000] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    >
      {[...brands, ...brands, ...brands, ...brands].map((b, i) => (
        <div
          key={`${b.name}-${i}`}
          className="flex flex-col items-center justify-center bg-card rounded-2xl border border-border shadow-sm p-6 min-w-[160px] h-[180px] hover:-translate-y-1 hover:shadow-md transition-all duration-300"
        >
          <img
            src={b.src}
            alt={b.name}
            className="h-24 w-auto object-contain mb-3"
          />
          <span className="font-display font-bold text-xs uppercase tracking-wide text-muted-foreground">
            {b.name}
          </span>
        </div>
      ))}
    </motion.div>
  </div>
);

const BrandsSection = () => (
  <SectionWrapper>
    <h2 className="section-heading text-center mb-5">
      Work With <span className="text-primary">300+</span> Amazing Brands
    </h2>
    <p className="section-subheading text-center mb-16 max-w-2xl mx-auto">
      You'll manage campaigns for exciting, high-growth brands across supplements, wellness, and CPG — seeing the direct impact of your work every day.
    </p>
    <div className="space-y-6">
      <MarqueeRow brands={row1} />
      <MarqueeRow brands={row2} reverse />
    </div>
  </SectionWrapper>
);

export default BrandsSection;
