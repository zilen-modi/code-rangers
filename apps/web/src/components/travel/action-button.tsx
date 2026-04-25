'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export function ActionButton({ label, icon: Icon, variant, onClick }: { label: string; icon: LucideIcon; variant: 'call' | 'navigate'; onClick?: () => void }) {
  const className = variant === 'call' ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-[#3B4252] text-white hover:bg-[#4A5264]';
  return (
    <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2 font-medium transition ${className}`}>
      <Icon className="h-4 w-4" />
      {label}
    </motion.button>
  );
}
