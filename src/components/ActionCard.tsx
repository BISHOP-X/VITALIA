import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: "teal" | "coral" | "sage" | "ocean";
  onClick: () => void;
  delay?: number;
}

const gradients = {
  teal: "from-primary/30 to-primary/10",
  coral: "from-accent/30 to-accent/10",
  sage: "from-status-healthy/30 to-status-healthy/10",
  ocean: "from-secondary to-secondary/50",
};

const iconColors = {
  teal: "text-primary",
  coral: "text-accent",
  sage: "text-status-healthy",
  ocean: "text-primary",
};

export function ActionCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  gradient, 
  onClick,
  delay = 0 
}: ActionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border border-white/10
        bg-gradient-to-br ${gradients[gradient]}
        backdrop-blur-md text-left
        transition-all duration-300
        hover:border-white/20 hover:shadow-lg
        group
      `}
    >
      <div className={`
        w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center
        bg-white/10 mb-3 sm:mb-4 group-hover:bg-white/20 transition-colors
      `}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColors[gradient]}`} />
      </div>
      
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground">
        {subtitle}
      </p>
    </motion.button>
  );
}
