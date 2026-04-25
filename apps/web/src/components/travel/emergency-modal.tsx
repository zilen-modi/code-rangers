'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';
import { EmergencySection } from './emergency-section';
import { EmergencyCategory, EmergencyItem } from './travel-data';
import { SOS_DEFAULT_COST } from '@/config/travel';
import { TravelPlace } from '@/features/travel/types';
import { calculateDistanceKm, formatDistanceKm } from '@/lib/geo';
import { useSosData } from '@/providers/sos-provider';

function toEmergencyItems(
  places: TravelPlace[],
  userCoords: { lat: number; lng: number },
): EmergencyItem[] {
  return places.map((place) => {
    const distanceKm = calculateDistanceKm(userCoords, { lat: place.lat, lng: place.lon });
    return {
      name: place.name || 'Unknown place',
      distance: formatDistanceKm(distanceKm),
      cost: SOS_DEFAULT_COST,
      tag: place.tags.amenity || place.type,
      lat: place.lat,
      lng: place.lon,
    };
  });
}

export function EmergencyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { categories, coords, locationError, isLoading, isError, requestLocation } = useSosData();

  const sections = useMemo(() => {
    if (coords === null) {
      return [] as EmergencyCategory[];
    }

    return categories.map((entry) => ({
      category: entry.categoryLabel,
      icon: ShieldAlert,
      iconClassName: 'bg-rose-500',
      items: toEmergencyItems(entry.list, coords),
    }));
  }, [categories, coords]);

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
              {locationError ? <p className="text-sm text-amber-300">{locationError}</p> : null}
              {locationError ? (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-400"
                >
                  Enable Location
                </button>
              ) : null}
              {locationError === null && coords === null ? (
                <p className="text-sm text-slate-300">Detecting your location for SOS services...</p>
              ) : null}
              {isLoading ? (
                <p className="text-sm text-slate-300">Loading nearby emergency services...</p>
              ) : null}
              {isError ? <p className="text-sm text-amber-300">Could not fetch live SOS services.</p> : null}
              {sections.map((section) => (
                <EmergencySection key={section.category} section={section} />
              ))}
              {!isLoading && !isError && locationError === null && coords !== null && sections.length === 0 ? (
                <p className="text-sm text-slate-300">
                  No SOS categories were returned by backend for this location.
                </p>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
