import { motion } from 'motion/react';
import { useRaceStore } from '../store/useRaceStore';
import { Cpu, Headphones, User, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { useEffect, useRef, useState } from 'react';

export function RadioFeed() {
  const messages = useRaceStore((state) => state.messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  // Force re-render every 100ms to update which messages should be visible
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Filter messages: show ai, driver, and engineer messages that have been "sent"
  // Engineer messages are "sent" if they're override OR if their deliveryTime has passed
  const filteredMessages = messages.filter(m => {
    if (m.sender === 'ai' || m.sender === 'driver') {
      return true;
    }
    if (m.sender === 'engineer') {
      // Show if override OR if delivery time has passed
      return m.isOverride || !m.deliveryTime || Date.now() >= m.deliveryTime;
    }
    return false;
  });  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#222] to-[#1a1a1a] px-4 py-3 border-b border-[rgba(225,6,0,0.3)] flex-shrink-0">
        <h2 className="f1-text text-white flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[#e10600]" />
          AI ↔ Driver Radio
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div ref={scrollRef} className="p-4 space-y-3">
          {/*  */}
          {filteredMessages.length === 0 ? (
            // Blank state message
            <div className="h-full flex items-center justify-center">
              <div className="text-center px-6 py-8">
                <Headphones className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 f1-text text-sm mb-2">
                  No messages yet
                </p>
                <p className="text-gray-600 text-xs">
                  Press{" "}
                  <kbd className="px-2 py-1 bg-[rgba(255,255,255,0.1)] rounded border border-gray-700 text-gray-400 f1-text">
                    T
                  </kbd>{" "}
                  to send a message
                </p>
              </div>
            </div>
          ) : (
            // Show messages when they exist
            filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${
                  message.sender === "driver" 
                    ? "justify-start" 
                    : message.sender === "engineer"
                    ? "justify-end"
                    : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 backdrop-blur-sm ${
                    message.sender === "driver"
                      ? "bg-[rgba(0,146,255,0.15)] border border-[rgba(0,146,255,0.3)]"
                      : message.sender === "engineer"
                      ? "bg-[rgba(225,6,0,0.15)] border border-[rgba(225,6,0,0.3)]"
                      : "bg-[rgba(0,210,190,0.15)] border border-[rgba(0,210,190,0.3)]"
                  }`}
                >
                  {/* Header with badge and time */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {message.sender === "driver" ? (
                      <Badge className="bg-[#0090ff] text-white border-0 px-2 py-0 text-[10px] glow-blue">
                        <Headphones className="w-3 h-3 mr-1" />
                        DRIVER
                      </Badge>
                    ) : message.sender === "engineer" ? (
                      <>
                        <Badge className="bg-[#e10600] text-white border-0 px-2 py-0 text-[10px] glow-red">
                          <User className="w-3 h-3 mr-1" />
                          ENGINEER
                        </Badge>
                        {message.isOverride && (
                          <Badge className="bg-[#ff0000] text-white border-0 px-2 py-0 text-[10px] animate-pulse">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            OVERRIDE
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge className="bg-[#00d2be] text-black border-0 px-2 py-0 text-[10px] glow-green">
                        <Cpu className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    <span className="text-[10px] text-gray-500 f1-text">
                      {message.timestamp}
                    </span>
                  </div>

                  {/* Message text */}
                  <p className="text-sm text-white">{message.text}</p>

                  {/* Confidence for AI messages */}
                  {message.sender === "ai" && message.confidence && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${message.confidence}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-[#00d2be] to-[#00ff88] glow-green"
                        />
                      </div>
                      <span className="text-[10px] text-[#00d2be] f1-text">
                        {message.confidence}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
