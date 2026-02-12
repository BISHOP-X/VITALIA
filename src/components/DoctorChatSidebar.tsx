import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ExternalLink } from "lucide-react";
import { ConversationList, Conversation } from "./ConversationList";
import { ChatPanel } from "./ChatPanel";

interface Message {
  id: number;
  sender: "patient" | "doctor";
  content: string;
  timestamp: string;
  read: boolean;
}

interface DoctorChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (patientId: number) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
  onViewProfile?: () => void;
}

export function DoctorChatSidebar({
  isOpen,
  onClose,
  conversations,
  selectedConversationId,
  onSelectConversation,
  messages,
  onSendMessage,
  isTyping = false,
  onViewProfile
}: DoctorChatSidebarProps) {
  const selectedConversation = conversations.find(
    conv => conv.patientId === selectedConversationId
  );

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

          {/* Sidebar */}
          <motion.div
            initial={{ 
              opacity: 0,
              x: "100%"
            }}
            animate={{ 
              opacity: 1,
              x: 0
            }}
            exit={{ 
              opacity: 0,
              x: "100%"
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            className="fixed top-0 right-0 z-50
                     w-full h-full lg:w-[700px]
                     bg-background/95 backdrop-blur-xl
                     border-l border-white/20
                     shadow-2xl
                     flex flex-col lg:flex-row"
          >
            {/* Mobile Header (visible only on mobile when no conversation selected) */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-secondary/30">
              <h2 className="text-lg font-bold text-foreground">Messages</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-secondary/50 hover:bg-secondary 
                         flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Conversation List Panel (Left) */}
            <div className={`
              ${selectedConversationId ? 'hidden lg:flex' : 'flex'}
              flex-col w-full lg:w-[280px] h-full
            `}>
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={onSelectConversation}
              />
            </div>

            {/* Active Chat Panel (Right) */}
            <div className={`
              ${selectedConversationId ? 'flex' : 'hidden lg:flex'}
              flex-col flex-1 h-full
            `}>
              {selectedConversation ? (
                <div className="flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10 bg-secondary/30">
                    <div className="flex items-center gap-3">
                      {/* Back Button (mobile only) */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onSelectConversation(0)}
                        className="lg:hidden w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary 
                                 flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                      </motion.button>

                      {/* Patient Info */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500">
                            {selectedConversation.patientAvatar ? (
                              <img 
                                src={selectedConversation.patientAvatar} 
                                alt={selectedConversation.patientName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                                {selectedConversation.patientName.charAt(0)}
                              </div>
                            )}
                          </div>
                          {selectedConversation.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {selectedConversation.patientName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {selectedConversation.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {onViewProfile && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={onViewProfile}
                          className="text-xs sm:text-sm text-primary hover:text-primary/80 
                                   flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary/50
                                   transition-all"
                        >
                          <span className="hidden sm:inline">View Profile</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                      
                      {/* Close Button (desktop only) */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="hidden lg:flex w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary 
                                 items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Embedded Chat (Messages + Input) */}
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex ${message.sender === "doctor" ? 'justify-end' : 'justify-start'} mb-3`}
                        >
                          <div className={`flex flex-col ${message.sender === "doctor" ? 'items-end' : 'items-start'} max-w-[80%]`}>
                            <div
                              className={`
                                p-3 rounded-2xl
                                ${message.sender === "doctor"
                                  ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-tr-none' 
                                  : 'bg-secondary/50 border border-white/10 text-foreground rounded-tl-none'
                                }
                              `}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1 px-1">
                              <span className="text-[10px] text-muted-foreground">
                                {message.timestamp}
                              </span>
                              {message.sender === "doctor" && (
                                <span className="text-[10px] text-teal-400">
                                  {message.read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-center gap-1 p-3 rounded-2xl bg-secondary/50 border border-white/10 w-fit">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-muted-foreground"
                                animate={{ y: [0, -8, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: i * 0.15
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10 bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              onSendMessage(e.currentTarget.value.trim());
                              e.currentTarget.value = '';
                            }
                          }}
                          className="flex-1 px-4 py-2.5 rounded-full 
                                   bg-secondary/50 border border-white/10
                                   text-sm text-foreground placeholder:text-muted-foreground
                                   focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20
                                   transition-all duration-300"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            if (input.value.trim()) {
                              onSendMessage(input.value.trim());
                              input.value = '';
                            }
                          }}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 
                                   flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
                        >
                          <span className="text-white text-lg">→</span>
                        </motion.button>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-2">
                        HIPAA compliant - All messages are encrypted
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                      <span className="text-4xl">💬</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a patient from the list to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
