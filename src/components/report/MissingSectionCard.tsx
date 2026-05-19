import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface MissingSectionCardProps {
  title: string;
  missingDataset: string;
}

const MissingSectionCard = ({ title, missingDataset }: MissingSectionCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-muted/50 rounded-2xl p-8 text-center"
  >
    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
    <h3 className="font-display font-bold text-lg mb-2 text-muted-foreground">{title}</h3>
    <p className="font-body text-sm text-muted-foreground">
      {missingDataset}
    </p>
  </motion.div>
);

export default MissingSectionCard;
