'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EmergencySection } from './emergency-section';
import { emergencyData } from './travel-data';

export function EmergencyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-24 right-4 w-[min(92vw,40rem)] rounded-2xl border border-[#2A3140] bg-[#0E1422] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.6)] md:right-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#2A3140] pb-4">
              <h2 className="text-xl font-semibold text-red-400">Emergency Services</h2>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
              {emergencyData.map((section) => <EmergencySection key={section.category} section={section} />)}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
