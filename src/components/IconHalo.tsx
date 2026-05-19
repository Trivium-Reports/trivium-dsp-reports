import { ReactNode } from "react";

const IconHalo = ({ children }: { children: ReactNode }) => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-4">
    <div className="absolute inset-0 halo-glow rounded-full scale-150" />
    <div className="relative text-primary">{children}</div>
  </div>
);

export default IconHalo;
