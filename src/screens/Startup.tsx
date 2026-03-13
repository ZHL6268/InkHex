import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface StartupProps {
  onComplete: () => void;
}

export const Startup: React.FC<StartupProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 3200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#efeee7] px-6">
      <motion.img
        src="/assets/ritual-mark.png"
        alt="太极八卦"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[21rem] sm:max-w-[25rem]"
      />
    </div>
  );
};
