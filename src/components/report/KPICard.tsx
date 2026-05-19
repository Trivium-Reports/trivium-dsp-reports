import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  delay?: number;
}

const KPICard = ({ label, value, subtitle, icon: Icon, delay = 0 }: KPICardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
  >
    <div className="flex items-center gap-2 mb-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="font-display font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
    </div>
    <p className="font-display font-extrabold text-3xl tracking-tight">{value}</p>
    {subtitle && (
      <p className="font-body text-xs text-muted-foreground mt-1.5">{subtitle}</p>
    )}
  </motion.div>
);

export default KPICard;
