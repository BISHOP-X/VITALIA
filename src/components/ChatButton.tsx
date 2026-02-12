import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface ChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen: boolean;
}

export function ChatButton({ onClick, unreadCount = 0, isOpen }: ChatButtonProps) {
  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 
                   w-14 h-14 sm:w-16 sm:h-16 rounded-full 
                   bg-gradient-to-br from-teal-500 to-cyan-500 
                   shadow-lg hover:shadow-xl 
                   flex items-center justify-center
                   transition-shadow duration-300"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 
                       bg-red-500 rounded-full 
                       flex items-center justify-center
                       border-2 border-background
                       shadow-lg"
            >
              <span className="text-white text-xs sm:text-sm font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
          
          {/* Pulse Animation */}
          <motion.div
            className="absolute inset-0 rounded-full bg-teal-400 opacity-0"
            animate={{
              scale: [1, 1.3, 1.3],
              opacity: [0.5, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
