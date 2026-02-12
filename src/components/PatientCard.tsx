import { motion } from "framer-motion";

interface PatientCardProps {
  name: string;
  age: number;
  avatar: string;
  status: "low" | "medium" | "high";
  lastVisit: string;
  onClick: () => void;
  delay?: number;
}

const statusConfig = {
  low: { 
    label: "Low Risk", 
    bgColor: "bg-status-low/20", 
    textColor: "text-status-low",
    borderColor: "border-status-low/30"
  },
  medium: { 
    label: "Medium Risk", 
    bgColor: "bg-status-medium/20", 
    textColor: "text-status-medium",
    borderColor: "border-status-medium/30"
  },
  high: { 
    label: "High Risk", 
    bgColor: "bg-status-high/20", 
    textColor: "text-status-high",
    borderColor: "border-status-high/30"
  },
};

export function PatientCard({ 
  name, 
  age, 
  avatar, 
  status, 
  lastVisit, 
  onClick,
  delay = 0 
}: PatientCardProps) {
  const config = statusConfig[status];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-3 sm:p-4 w-full text-left group cursor-pointer"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="relative">
          <img
            src={avatar}
            alt={name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border-2 border-white/10"
          />
          <div className={`
            absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full 
            ${config.bgColor} border ${config.borderColor}
            flex items-center justify-center
          `}>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${config.textColor} bg-current`} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5 sm:mb-1 gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
              {name}
            </h3>
            <span className={`
              px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap
              ${config.bgColor} ${config.textColor}
            `}>
              {config.label}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {age} years old
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
            Last visit: {lastVisit}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
