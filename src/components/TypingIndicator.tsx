import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-3 rounded-2xl bg-secondary/50 border border-white/10 w-fit max-w-[80%]">
      <motion.div
        className="w-2 h-2 rounded-full bg-muted-foreground"
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-muted-foreground"
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.15,
        }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-muted-foreground"
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
    </div>
  );
}
