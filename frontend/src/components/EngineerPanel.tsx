import { motion } from 'motion/react';
import { useRaceStore } from '../store/useRaceStore';
import { Mic, MicOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export function EngineerPanel() {
  const { isTranscribing, currentTranscription, setIsTranscribing, setCurrentTranscription, addMessage } = useRaceStore();
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [overrideActive, setOverrideActive] = useState(false);

  const mockTranscriptions = [
    'Box this lap for medium tires',
    'Front wing adjustment needed',
    'Increase fuel mix to mode 3',
    'Watch your tire temperatures',
    'Gap to car behind is safe',
  ];

  const handleMouseDown = () => {
    setIsTranscribing(true);
    setCurrentTranscription('');

    // Simulate live transcription
    const timer = setTimeout(() => {
      const randomText = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      setCurrentTranscription(randomText);
    }, 500);

    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    setIsTranscribing(false);

    if (pressTimer) {
      clearTimeout(pressTimer);
    }

    // Send the message if there's transcription
    if (currentTranscription) {
      addMessage({
        sender: 'engineer',
        text: currentTranscription,
      });
      setCurrentTranscription('');
    }
  };

  useEffect(() => {
    return () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
      }
    };
  }, [pressTimer]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-2.5 border-b border-[rgba(225,6,0,0.5)] glow-red flex-shrink-0">
        <h3 className="f1-text text-white text-sm">Engineer Control</h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col items-center justify-start gap-3 overflow-hidden">
        {/* Buttons Row - Override and Push to Talk */}
        <div className="flex items-center justify-center gap-4 flex-shrink-0">
          {/* Override Button */}
          <motion.button
            onClick={() => setOverrideActive(!overrideActive)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-24 h-24 rounded-full border-4 transition-all duration-300 flex-shrink-0 ${
              overrideActive
                ? 'border-[#ff9500] bg-gradient-to-br from-[#ff9500] to-[#ff6b00] shadow-[0_0_15px_rgba(255,149,0,0.6),0_0_30px_rgba(255,149,0,0.3)] animate-pulse'
                : 'border-[rgba(255,149,0,0.5)] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] hover:border-[#ff9500]'
            }`}
          >
            {/* Pulse ring animation when active */}
            {overrideActive && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[#ff9500]"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <span className={`f1-text text-[10px] font-bold ${overrideActive ? 'text-white' : 'text-gray-400'}`}>
                OVERRIDE
              </span>
            </div>
          </motion.button>

          {/* Transcribe Button */}
          <motion.button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-24 h-24 rounded-full border-4 transition-all duration-300 flex-shrink-0 ${
              isTranscribing
                ? 'border-[#e10600] bg-gradient-to-br from-[#e10600] to-[#b00500] glow-red-strong animate-pulse'
                : 'border-[rgba(225,6,0,0.5)] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] hover:border-[#e10600]'
            }`}
          >
            {/* Pulse ring animation when active */}
            {isTranscribing && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[#e10600]"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              {isTranscribing ? (
                <Mic className="w-10 h-10 text-white" />
              ) : (
                <MicOff className="w-10 h-10 text-gray-400" />
              )}
            </div>
          </motion.button>
        </div>

        {/* Label */}
        <div className="text-center flex-shrink-0">
          <p className="f1-text text-white text-sm mb-0.5">
            {isTranscribing ? 'Recording...' : 'Push to Talk'}
          </p>
          <p className="text-[10px] text-gray-500">Hold button to transmit</p>
        </div>

        {/* Live Transcription Box */}
        <div className="w-full flex-1 min-h-0 bg-[rgba(0,0,0,0.4)] border border-[rgba(225,6,0,0.3)] rounded-lg p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${isTranscribing ? 'bg-[#e10600] animate-pulse' : 'bg-gray-600'}`} />
            <span className="f1-text text-xs text-gray-400">Live Transcription</span>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: currentTranscription ? 1 : 0.5 }}
            className="text-sm text-white flex-1 overflow-y-auto"
          >
            {currentTranscription || 'Press and hold button to start...'}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
