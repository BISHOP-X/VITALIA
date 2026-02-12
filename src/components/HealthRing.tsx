import { motion } from "framer-motion";

interface HealthRingProps {
  progress: number;
  status: "low" | "medium" | "high";
  size?: number;
  strokeWidth?: number;
}

const statusColors = {
  low: "hsl(150, 60%, 50%)",
  medium: "hsl(35, 90%, 55%)",
  high: "hsl(0, 72%, 55%)",
};

const statusGlows = {
  low: "0 0 30px hsla(150, 60%, 50%, 0.5)",
  medium: "0 0 30px hsla(35, 90%, 55%, 0.5)",
  high: "0 0 30px hsla(0, 72%, 55%, 0.5)",
};

export function HealthRing({ 
  progress, 
  status, 
  size, 
  strokeWidth = 12 
}: HealthRingProps) {
  // Responsive size: use container width if size is undefined
  const actualSize = size || 180;
  const radius = (actualSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-full aspect-square max-w-[180px] mx-auto">
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            statusGlows[status],
            statusGlows[status].replace("0.5", "0.3"),
            statusGlows[status],
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <svg viewBox={`0 0 ${actualSize} ${actualSize}`} className="w-full h-full rotate-[-90deg]">
        {/* Background ring */}
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          fill="none"
          stroke="hsl(195, 25%, 20%)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress ring */}
        <motion.circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          fill="none"
          stroke={statusColors[status]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-2xl sm:text-3xl font-bold"
          style={{ color: statusColors[status] }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {progress}%
        </motion.span>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-0.5 sm:mt-1">
          Health Score
        </span>
      </div>
    </div>
  );
}
