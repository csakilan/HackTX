import { motion } from 'motion/react';
import { useRaceStore } from '../store/useRaceStore';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Radio } from 'lucide-react';
import { useEffect } from 'react';

export function DriverAudio() {
  const { waveformData, updateWaveform } = useRaceStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateWaveform();
    }, 100);

    return () => clearInterval(interval);
  }, [updateWaveform]);

  const chartData = waveformData.map((value, index) => ({
    index,
    value,
  }));

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(0,146,255,0.3)] overflow-hidden glow-blue">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0090ff] to-[#006bb3] px-4 py-2.5 border-b border-[rgba(0,146,255,0.5)] flex-shrink-0">
        <h3 className="f1-text text-white flex items-center gap-2 text-sm">
          <Radio className="w-4 h-4" />
          Driver Audio (Live)
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        {/* Waveform Visualization */}
        <div className="flex-[2] min-h-0 bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(0,146,255,0.2)] overflow-hidden relative">
          {/* Grid lines for effect */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-[#0090ff]"
                style={{ top: `${i * 10}%` }}
              />
            ))}
          </div>

          {/* Waveform */}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="waveformGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0090ff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0090ff" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0090ff"
                strokeWidth={2}
                fill="url(#waveformGradient)"
                animationDuration={100}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Live indicator */}
          <motion.div
            className="absolute top-2 right-2 flex items-center gap-2 bg-[rgba(0,0,0,0.8)] px-2 py-1 rounded-full border border-[#0090ff]"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#0090ff] animate-pulse" />
            <span className="f1-text text-[10px] text-[#0090ff]">LIVE</span>
          </motion.div>
        </div>

        {/* Mini Transcript Preview */}
        <div className="flex-1 min-h-0 bg-[rgba(0,0,0,0.4)] border border-[rgba(0,146,255,0.2)] rounded-lg p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0090ff]" />
            <span className="f1-text text-xs text-gray-400">Last Transmission</span>
          </div>
          <p className="text-xs text-white mb-1 flex-1 overflow-y-auto">
            "Copy that. How are we looking on strategy?"
          </p>
          <p className="text-[10px] text-gray-500 f1-text flex-shrink-0">14:34:22</p>
        </div>
      </div>
    </div>
  );
}
