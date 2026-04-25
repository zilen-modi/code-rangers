'use client';

import { motion } from 'framer-motion';
import { Siren } from 'lucide-react';

export function FloatingEmergencyButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-300/50 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_0_26px_rgba(239,68,68,0.65)]"
      >
        <Siren className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
