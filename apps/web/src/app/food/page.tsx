'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Clock3, MapPin, Navigation, Search, Share2, SlidersHorizontal, Star } from 'lucide-react';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { Sidebar } from '@/components/travel/sidebar';

const spots = [
  { id: 'somtam', name: 'Som Tam Stand', subtitle: 'Street Food', rating: 4.8, reviews: 189, distanceKm: 0.8, price: '$', tags: ['Local vibe', 'Fresh daily'], area: 'hidden', aiSummary: 'Best spicy papaya salad nearby.' },
  { id: 'krua', name: 'Krua Apsorn', subtitle: 'Traditional Thai', rating: 4.9, reviews: 1203, distanceKm: 0.9, price: '$$', tags: ['Must try', 'Award-winning'], area: 'locals', aiSummary: 'Classic Thai favorites and reliable quality.' },
];

export default function FoodPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const filtered = useMemo(() => spots.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const spot = filtered.find((s) => s.id === selected) ?? null;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <Sidebar />
      <section className="relative px-4 pb-12 pt-4 md:ml-72 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {!spot ? (
            <>
              <header><h1 className="text-2xl font-semibold">Food Discovery</h1><p className="text-sm text-muted-foreground">Find authentic dishes, not just restaurants</p></header>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you want to eat?" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/70"><SlidersHorizontal className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="space-y-3">
                {filtered.map((s) => (
                  <button key={s.id} type="button" onClick={() => setSelected(s.id)} className="w-full rounded-xl border border-border/60 bg-background/70 p-4 text-left hover:border-primary/35">
                    <div className="flex items-start justify-between"><div><p className="text-sm font-semibold">{s.name}</p><p className="text-xs text-muted-foreground">{s.subtitle}</p></div><span className="inline-flex items-center gap-1 text-xs text-amber-500"><Star className="h-3.5 w-3.5 fill-current" />{s.rating}</span></div>
                    <p className="mt-2 text-xs text-muted-foreground">📍 {s.distanceKm} km • {s.price}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setSelected(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-secondary/70"><ArrowLeft className="h-4 w-4" /></button>
              <div className="h-36 rounded-2xl bg-gradient-to-r from-orange-700/70 via-rose-800/60 to-red-900/70" />
              <article className="-mt-10 rounded-xl border border-border/60 bg-background/80 p-4">
                <h2 className="text-lg font-semibold">{spot.name}</h2>
                <p className="text-xs text-muted-foreground">{spot.subtitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">⭐ {spot.rating} ({spot.reviews}) • <MapPin className="inline h-3 w-3" /> {spot.distanceKm} km • {spot.price} • <Clock3 className="inline h-3 w-3" /> Open until 10 PM</p>
              </article>
              <article className="rounded-xl border border-primary/25 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 p-4"><p className="text-sm font-semibold">✨ AI Summary</p><p className="mt-2 text-sm text-foreground/85">{spot.aiSummary}</p></article>
              <div className="flex gap-2">
                <button type="button" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white"><Navigation className="h-4 w-4" />Get Directions</button>
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-secondary/70 px-4 py-2 text-sm"><Share2 className="h-4 w-4" />Share</button>
              </div>
            </>
          )}
        </div>
      </section>
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
