import { motion } from "framer-motion";

interface Message {
  id: number;
  sender: "patient" | "doctor";
  content: string;
  timestamp: string;
  read: boolean;
}

interface MessageBubbleProps {
  message: Message;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isDoctor = message.sender === "doctor";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isDoctor ? 'justify-start' : 'justify-end'} mb-3 sm:mb-4`}
    >
      <div className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'} max-w-[80%]`}>
        {/* Message Bubble */}
        <div
          className={`
            p-3 rounded-2xl
            ${isDoctor 
              ? 'bg-secondary/50 border border-white/10 text-foreground rounded-tl-none' 
              : 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-tr-none'
            }
          `}
        >
          <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        
        {/* Timestamp */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {message.timestamp}
          </span>
          
          {/* Read Receipt (for sent messages only) */}
          {!isDoctor && (
            <span className="text-[10px] text-teal-400">
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
