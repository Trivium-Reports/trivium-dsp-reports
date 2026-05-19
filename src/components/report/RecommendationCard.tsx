import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  description: string;
  delay?: number;
}

const RecommendationCard = ({ title, description, delay = 0 }: RecommendationCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-card border-l-4 border-primary rounded-2xl p-6 shadow-sm"
  >
    <div className="flex items-start gap-3">
      <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-display font-bold text-sm mb-1">{title}</h4>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

export default RecommendationCard;
