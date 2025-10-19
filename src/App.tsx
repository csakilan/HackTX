import { DriverStandings } from './components/DriverStandings';
import { RadioFeed } from './components/RadioFeed';
import { EngineerPanel } from './components/EngineerPanel';
import { DriverAudio } from './components/DriverAudio';
import { ConversationTabs } from './components/ConversationTabs';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] p-4 overflow-hidden">
      <div className="max-w-[1920px] mx-auto h-[calc(100vh-2rem)]">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr_340px] gap-4 h-full">
          {/* Left Column - Driver Standings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full min-h-0"
          >
            <DriverStandings />
          </motion.div>

          {/* Center Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4 h-full min-h-0"
          >
            {/* Top - Radio Feed */}
            <div className="flex-1 min-h-0">
              <RadioFeed />
            </div>

            {/* Bottom - Engineer Panel & Driver Audio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[380px] flex-shrink-0">
              <EngineerPanel />
              <DriverAudio />
            </div>
          </motion.div>

          {/* Right Column - Conversation Tabs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full min-h-0"
          >
            <ConversationTabs />
          </motion.div>
        </div>

        {/* F1 Branding Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e10600] to-transparent opacity-50"
        />
      </div>
    </div>
  );
}
