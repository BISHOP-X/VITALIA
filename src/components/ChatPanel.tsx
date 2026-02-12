import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface Message {
  id: number;
  sender: "patient" | "doctor";
  content: string;
  timestamp: string;
  read: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName?: string;
  isOnline?: boolean;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
}

export function ChatPanel({ 
  isOpen, 
  onClose, 
  doctorName = "Dr. Martinez",
  isOnline = true,
  messages,
  onSendMessage,
  isTyping = false
}: ChatPanelProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile only) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ 
              opacity: 0,
              x: "100%",
              y: 0
            }}
            animate={{ 
              opacity: 1,
              x: 0,
              y: 0
            }}
            exit={{ 
              opacity: 0,
              x: "100%",
              y: 0
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            className="fixed bottom-0 right-0 z-50
                     w-full h-[70vh] lg:w-[400px] lg:h-full
                     flex flex-col
                     bg-background/95 backdrop-blur-xl
                     border-l border-t lg:border-t-0 border-white/20
                     shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-secondary/30">
              <div className="flex items-center gap-3">
                {/* Doctor Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {/* Online Indicator */}
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>

                {/* Doctor Info */}
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">
                    {doctorName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-secondary/50 hover:bg-secondary 
                         flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                      <User className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500" />
                    </div>
                    <p className="text-sm sm:text-base font-medium text-foreground mb-1">
                      Start a conversation
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Send a message to {doctorName}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <MessageBubble key={message.id} message={message} index={index} />
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <TypingIndicator />
                    </motion.div>
                  )}
                </>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-secondary/30">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full pl-4 pr-12 py-3 rounded-full 
                             bg-secondary/50 border border-white/10
                             text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20
                             transition-all duration-300"
                  />
                </div>

                {/* Send Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full 
                           bg-gradient-to-br from-teal-500 to-cyan-500 
                           flex items-center justify-center
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Send className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
                </motion.button>
              </div>
              
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2">
                Messages are monitored for quality assurance
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
