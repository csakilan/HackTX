import { motion } from 'motion/react';
import { useRaceStore } from '../store/useRaceStore';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Send, Cpu, User, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ConversationTabs() {
  const { messages } = useRaceStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'in-progress' | 'completed'>>({});

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const engineerMessages = messages.filter(m => m.sender === 'engineer');

  const handleSend = (messageId: string) => {
    setMessageStatuses(prev => ({ ...prev, [messageId]: 'in-progress' }));
    
    // Simulate sending and mark as completed after 2 seconds
    setTimeout(() => {
      setMessageStatuses(prev => ({ ...prev, [messageId]: 'completed' }));
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#222] to-[#1a1a1a] px-4 py-3 border-b border-[rgba(225,6,0,0.3)] flex-shrink-0">
        <h2 className="f1-text text-white">Engineer Feed & AI</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">Race engineer transmissions with AI recommendations</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div ref={scrollRef} className="p-4 space-y-4">{/*  */}
          {engineerMessages.map((message, index) => {
            const status = messageStatuses[message.id];
            // Get the next AI message that follows this engineer message
            const messageIndex = messages.findIndex(m => m.id === message.id);
            const nextAIMessage = messages
              .slice(messageIndex + 1)
              .find(m => m.sender === 'ai');

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-[rgba(225,6,0,0.08)] to-[rgba(225,6,0,0.02)] border border-[rgba(225,6,0,0.3)] rounded-lg overflow-hidden"
              >
                {/* Engineer Message */}
                <div className="p-4 border-b border-[rgba(225,6,0,0.2)]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#e10600] text-white border-0 px-2 py-0.5 text-[10px] glow-red">
                        <User className="w-3 h-3 mr-1" />
                        ENGINEER
                      </Badge>
                      <span className="text-[10px] text-gray-500 f1-text">{message.timestamp}</span>
                    </div>

                    {/* Status Indicator */}
                    {status && (
                      <Badge 
                        className={`${
                          status === 'completed'
                            ? 'bg-[#00d2be] text-black'
                            : 'bg-[#ffa500] text-black'
                        } border-0 px-2 py-0.5 text-[10px]`}
                      >
                        {status === 'completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            COMPLETED
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                            IN PROGRESS
                          </>
                        )}
                      </Badge>
                    )}
                  </div>

                  {/* Message Text */}
                  <p className="text-sm text-white mb-3 font-medium">{message.text}</p>

                  {/* Send Button */}
                  {!status && (
                    <Button
                      size="sm"
                      onClick={() => handleSend(message.id)}
                      className="bg-[#e10600] hover:bg-[#b00500] text-white border-0 h-7 px-3 f1-text text-xs glow-red transition-all"
                    >
                      <Send className="w-3 h-3 mr-1.5" />
                      Send to Driver
                    </Button>
                  )}
                </div>

                {/* AI Recommendation */}
                {nextAIMessage && (
                  <div className="p-4 bg-[rgba(0,210,190,0.08)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-[#00d2be] text-black border-0 px-2 py-0.5 text-[10px] glow-green">
                        <Cpu className="w-3 h-3 mr-1" />
                        AI RECOMMENDATION
                      </Badge>
                    </div>

                    {/* AI Text */}
                    <p className="text-sm text-[#00d2be] mb-3">{nextAIMessage.text}</p>

                    {/* Confidence Bar */}
                    {nextAIMessage.confidence && (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 f1-text w-24 flex-shrink-0">CONFIDENCE</span>
                        <div className="flex-1 h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${nextAIMessage.confidence}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-[#00d2be] to-[#00ff88] glow-green"
                          />
                        </div>
                        <span className="text-[10px] text-[#00d2be] f1-text w-10 text-right flex-shrink-0 font-bold">
                          {nextAIMessage.confidence}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Empty State */}
          {engineerMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <User className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-500 f1-text text-sm">No engineer transmissions yet</p>
              <p className="text-gray-600 text-xs mt-1">Press push-to-talk to send a message</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
