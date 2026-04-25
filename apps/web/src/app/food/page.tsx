'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock3,
  MapPin,
  Navigation,
  Search,
  Share2,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { Sidebar } from '@/components/travel/sidebar';

const spots = [
  {
    id: 'massaman',
    emoji: '🍛',
    name: 'Massaman Curry',
    subtitle: 'Grandma Secret Recipe',
    rating: 4.8,
    reviews: 254,
    distanceKm: 1.4,
    price: '$',
    tags: ['Local favorite', 'Family-run'],
    area: 'hidden',
    aiSummary: 'Rich coconut curry with warm spices. Great comfort food with balanced heat.',
  },
  {
    id: 'padpak',
    emoji: '🥬',
    name: 'Pad Pak Boong',
    subtitle: 'Morning Glory Corner',
    rating: 4.7,
    reviews: 189,
    distanceKm: 0.8,
    price: '$',
    tags: ['Vegetarian', 'Fresh'],
    area: 'hidden',
    aiSummary: 'Perfect quick dish if you want something light but full of flavor.',
  },
  {
    id: 'boatnoodle',
    emoji: '🍜',
    name: 'Kuay Teow Ruea',
    subtitle: 'Boat Noodle Alley',
    rating: 4.8,
    reviews: 566,
    distanceKm: 1.2,
    price: '$',
    tags: ['Traditional', 'Must try'],
    area: 'hidden',
    aiSummary: 'Deep, aromatic broth and authentic street-style noodles.',
  },
  {
    id: 'jayfai',
    emoji: '🦀',
    name: 'Jay Fai',
    subtitle: 'Crab Omelette',
    rating: 4.9,
    reviews: 1203,
    distanceKm: 2.1,
    price: '$$$',
    tags: ['Michelin Star', 'Celebrity chef', 'Street-friendly'],
    area: 'locals',
    aiSummary:
      'Legendary street food elevated to Michelin status. Amazing taste and unique wok style, but expect long waits.',
  },
  {
    id: 'padthai',
    emoji: '🍝',
    name: 'Pad Thai',
    subtitle: 'Thip Samai',
    rating: 4.8,
    reviews: 997,
    distanceKm: 1.9,
    price: '$$',
    tags: ['Since 1966', 'Iconic'],
    area: 'locals',
    aiSummary: 'Top pick for visitors looking for classic, reliable Pad Thai.',
  },
];

const reviews = [
  {
    name: 'Sarah M.',
    text: 'Absolutely amazing! The crab omelette was incredible. A bit pricey but worth every baht.',
    helpful: 24,
    label: 'Traveler',
  },
  {
    name: 'Somchai T.',
    text: 'Best omelette in Bangkok. Go early to avoid the queue.',
    helpful: 18,
    label: 'Local',
  },
  {
    name: 'Mike R.',
    text: 'Great food but service is slow. I waited around 90 minutes.',
    helpful: 12,
    label: 'Traveler',
  },
];

export default function FoodPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const filtered = useMemo(() => spots.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const spot = spots.find((s) => s.id === selected) ?? null;
  const hiddenGems = filtered.filter((s) => s.area === 'hidden');
  const localsLove = filtered.filter((s) => s.area === 'locals');

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <Sidebar />
      <section className="relative px-4 pb-12 pt-4 md:ml-72 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {!spot ? (
            <>
              <header>
                <h1 className="text-2xl font-semibold">Food Discovery</h1>
                <p className="text-sm text-muted-foreground">Find authentic dishes, not just restaurants</p>
              </header>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What do you want to eat?"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/70 text-foreground hover:bg-secondary dark:text-white"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Budget-friendly', 'Under 1 km', 'Vegetarian', 'Spicy'].map((chip, idx) => (
                    <span
                      key={chip}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        idx === 0
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                          : 'border border-border/70 bg-secondary/75 text-foreground hover:bg-secondary dark:text-white'
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-medium">Hidden Gems 💎</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {hiddenGems.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelected(s.id)}
                      className="rounded-xl border border-border/60 bg-background/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/35"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                        </div>
                        <span className="text-lg">{s.emoji}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        ⭐ {s.rating} ({s.reviews}) • 📍 {s.distanceKm} km • {s.price}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-medium">Locals Love This 🔥</h2>
                <div className="space-y-3">
                  {localsLove.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelected(s.id)}
                      className="w-full rounded-xl border border-border/60 bg-background/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/35"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                        </div>
                        <span className="text-lg">{s.emoji}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        ⭐ {s.rating} ({s.reviews}) • 📍 {s.distanceKm} km • {s.price}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-secondary/70"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-36 rounded-2xl bg-gradient-to-r from-orange-700/70 via-rose-800/60 to-red-900/70" />
              <article className="-mt-10 rounded-xl border border-border/60 bg-background/80 p-4">
                <h2 className="text-lg font-semibold">{spot.name}</h2>
                <p className="text-xs text-muted-foreground">{spot.subtitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ⭐ {spot.rating} ({spot.reviews}) • <MapPin className="inline h-3 w-3" /> {spot.distanceKm} km •{' '}
                  {spot.price} • <Clock3 className="inline h-3 w-3" /> Open until 10 PM
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {spot.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
              <article className="rounded-xl border border-primary/25 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 p-4">
                <p className="text-sm font-semibold">✨ AI Summary</p>
                <p className="mt-2 text-sm text-foreground/85">{spot.aiSummary}</p>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-full bg-green-500/20 px-2 py-1 text-[10px] text-green-700 dark:text-green-300">
                    ✓ Amazing food
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] text-amber-700 dark:text-amber-300">
                    ⚠ Slow service
                  </span>
                </div>
              </article>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Reviews ({reviews.length})</h3>
                  <div className="flex gap-1">
                    {['All', 'Local', 'Traveler', 'Verified'].map((chip, idx) => (
                      <button
                        key={chip}
                        type="button"
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          idx === 0
                            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                            : 'border border-border/70 bg-secondary/75 text-foreground hover:bg-secondary dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <article key={review.name} className="rounded-xl border border-border/60 bg-background/80 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-xs text-white">
                            {review.name[0]}
                          </span>
                          <p className="text-sm font-medium">{review.name}</p>
                        </div>
                        <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-700 dark:text-sky-300">
                          {review.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-amber-500 dark:text-yellow-300">★ ★ ★ ★ ★</p>
                      <p className="mt-2 text-sm text-foreground/85">{review.text}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Helpful ({review.helpful})</p>
                    </article>
                  ))}
                </div>
              </section>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white"
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-secondary/80 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
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
