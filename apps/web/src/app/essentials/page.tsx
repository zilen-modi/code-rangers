'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { BatteryCharging, Landmark, MapPinned, Navigation, Toilet } from 'lucide-react';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { Sidebar } from '@/components/travel/sidebar';

const EssentialsMap = dynamic(() => import('@/components/travel/essentials-map').then((m) => m.EssentialsMap), { ssr: false });

const quickCategories = [
  { key: 'charging', label: 'Charging', icon: BatteryCharging, iconClass: 'from-amber-500 to-orange-500' },
  { key: 'atm', label: 'ATM', icon: Landmark, iconClass: 'from-emerald-500 to-green-600' },
  { key: 'petrol', label: 'Petrol', iconClass: 'from-sky-500 to-blue-600', icon: MapPinned },
  { key: 'toilets', label: 'Toilets', icon: Toilet, iconClass: 'from-violet-500 to-fuchsia-500' },
] as const;

const essentialLocations = [
  { name: 'Starbucks Coffee', type: 'charging', distance: '0.2 km', cost: 'Free with purchase', tag: 'Tourist-friendly', note: 'Available', mapsQuery: 'Starbucks Coffee Bangkok', lat: 13.7329, lng: 100.5697 },
  { name: 'Central Shopping Mall', type: 'charging', distance: '0.5 km', cost: 'Free', tag: 'Fast charging', note: 'Multiple ports', mapsQuery: 'Central Shopping Mall Bangkok charging station', lat: 13.7466, lng: 100.5393 },
  { name: 'Kasikorn Bank ATM', type: 'atm', distance: '0.4 km', cost: 'No fee', tag: '24/7 ATM', note: 'International cards accepted', mapsQuery: 'Kasikorn ATM Bangkok', lat: 13.7422, lng: 100.5524 },
  { name: 'PTT Station Sukhumvit', type: 'petrol', distance: '1.1 km', cost: 'Fuel + EV charging', tag: 'Open now', note: 'Convenience store onsite', mapsQuery: 'PTT Station Sukhumvit Bangkok', lat: 13.7297, lng: 100.5822 },
  { name: 'MRT Public Restroom', type: 'toilets', distance: '0.3 km', cost: 'Free', tag: 'Clean', note: 'Accessible', mapsQuery: 'MRT Station restroom Bangkok', lat: 13.7376, lng: 100.5608 },
];

export default function EssentialsPage() {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<(typeof quickCategories)[number]['key']>('charging');
  const [showMap, setShowMap] = useState(true);
  const filteredLocations = essentialLocations.filter((l) => l.type === activeCategory);
  const openLocationMap = (query: string) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <Sidebar />
      <section className="relative px-4 pb-12 pt-4 md:ml-72 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <header><h1 className="text-2xl font-semibold">Essentials Nearby</h1><p className="text-sm text-muted-foreground">Find what you need, right when you need it</p></header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.key;
              return (
                <button key={category.label} type="button" onClick={() => setActiveCategory(category.key)} className={`rounded-2xl border p-5 backdrop-blur-xl transition hover:-translate-y-0.5 ${isActive ? 'border-primary/30 bg-gradient-to-br from-primary/20 to-accent/15 shadow-[0_0_0_1px_hsl(var(--primary)/0.14),0_14px_34px_rgba(0,0,0,0.2)]' : 'border-border/70 bg-background/70 dark:border-white/15 dark:bg-white/5'}`}>
                  <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/70 dark:bg-white/10"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${category.iconClass}`}><Icon className="h-4 w-4 text-white" /></span></div>
                  <p className="text-sm text-foreground/90">{category.label}</p>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{filteredLocations.length} locations found</p>
            <button type="button" onClick={() => setShowMap((p) => !p)} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"><MapPinned className="h-3.5 w-3.5" />{showMap ? 'Hide Map' : 'Map View'}</button>
          </div>
          {showMap && <EssentialsMap locations={filteredLocations} />}
          <div className="space-y-3">
            {filteredLocations.map((location) => (
              <article key={location.name} className="rounded-xl border border-border/70 bg-background/70 p-3 backdrop-blur-xl dark:border-white/15 dark:bg-white/5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="text-sm font-semibold">{location.name}</h3><span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-700 dark:text-green-400">{location.tag}</span></div>
                    <p className="mt-1 text-xs text-muted-foreground">{location.distance} • {location.cost}</p>
                    <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">● {location.note}</p>
                  </div>
                  <button type="button" onClick={() => openLocationMap(location.mapsQuery)} className="rounded-md border border-border/60 bg-secondary/80 px-2 py-1 text-[10px] font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">Details</button>
                </div>
                <button type="button" onClick={() => openLocationMap(location.mapsQuery)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white"><Navigation className="h-4 w-4" />Navigate</button>
              </article>
            ))}
          </div>
        </div>
      </section>
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
