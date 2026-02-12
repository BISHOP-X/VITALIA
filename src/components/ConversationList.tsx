import { motion } from "framer-motion";
import { Search, User } from "lucide-react";
import { useState } from "react";

export interface Conversation {
  patientId: number;
  patientName: string;
  patientAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (patientId: number) => void;
}

export function ConversationList({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation 
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(conv =>
    conv.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-secondary/20 border-r border-white/10">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-bold text-foreground mb-3">Messages</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-white/10
                     text-sm text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                     transition-all duration-300"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-sm text-muted-foreground text-center">
              {searchQuery ? "No conversations found" : "No active conversations"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation, index) => (
              <motion.button
                key={conversation.patientId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectConversation(conversation.patientId)}
                className={`
                  w-full p-3 rounded-lg text-left
                  transition-all duration-300
                  hover:bg-secondary/30
                  ${selectedConversationId === conversation.patientId 
                    ? 'bg-secondary/50 border-l-4 border-primary shadow-sm' 
                    : 'border-l-4 border-transparent'
                  }
                  mb-2
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500">
                      {conversation.patientAvatar ? (
                        <img 
                          src={conversation.patientAvatar} 
                          alt={conversation.patientName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Online Indicator */}
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {conversation.patientName}
                      </h3>
                      <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                        {conversation.lastMessageTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${
                        conversation.unreadCount > 0 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground'
                      }`}>
                        {conversation.lastMessage}
                      </p>
                      
                      {/* Unread Badge */}
                      {conversation.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
