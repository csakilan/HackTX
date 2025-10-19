import { DriverStandings } from "./components/DriverStandings";
import { RadioFeed } from "./components/RadioFeed";
import { EngineerPanel } from "./components/EngineerPanel";
import { DriverAudio } from "./components/DriverAudio";
import { ConversationTabs } from "./components/ConversationTabs";
import { FuelConsumption } from "./components/FuelConsumption";
import { ThrottleBrake } from "./components/ThrottleBrake";
import { TireTemperature } from "./components/TireTemperature";
import { BrakeTemperature } from "./components/BrakeTemperature";
import { ScrollButton } from "./components/ScrollButton";
import { motion } from "motion/react";
import { useEffect } from "react";

export default function App() {
  // Simple backend connection check
  useEffect(() => {
    fetch("http://localhost:8787/health")
      .then((res) => res.json())
      .then((data) => console.log("✅ Backend Connected:", data))
      .catch((err) => console.error("❌ Backend Error:", err.message));
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] overflow-y-auto">
      {/* Main Dashboard Section */}
      <div className="p-4">
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
        </div>
      </div>

      {/* Scroll Down Button */}
      <ScrollButton targetId="telemetry-section" />

      {/* Extended Telemetry Section */}
      <div id="telemetry-section" className="p-4 pt-8">
        <div className="max-w-[1920px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h1 className="f1-text text-4xl text-white mb-6 text-center">
              Telemetry Data
            </h1>

            {/* Telemetry Grid - 2x2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Fuel Consumption */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="h-[500px]"
              >
                <FuelConsumption />
              </motion.div>

              {/* Throttle & Brake */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="h-[500px]"
              >
                <ThrottleBrake />
              </motion.div>

              {/* Tire Temperature */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="h-[500px]"
              >
                <TireTemperature />
              </motion.div>

              {/* Brake Temperature */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="h-[500px]"
              >
                <BrakeTemperature />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* F1 Branding Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="h-1 bg-gradient-to-r from-transparent via-[#e10600] to-transparent opacity-50"
      />
    </div>
  );
}
