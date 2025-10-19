import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface ScrollButtonProps {
  targetId: string;
}

export function ScrollButton({ targetId }: ScrollButtonProps) {
  const scrollToSection = () => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={scrollToSection}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-[#e10600] to-[#b00500] hover:from-[#ff1a1a] hover:to-[#e10600] text-white rounded-full p-4 shadow-lg border border-[rgba(225,6,0,0.5)] transition-all glow-red"
      aria-label="Scroll to telemetry"
    >
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </motion.button>
  );
}
