'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { DEFAULT_TRAVEL_COORDS, GEOLOCATION_OPTIONS } from '@/config/travel';
import { useFoodInfoQuery } from '@/features/food/hooks/use-food-info-query';
import { TravelPlace } from '@/features/travel/types';
import { calculateDistanceKm, toLatLngQuery } from '@/lib/geo';
import { buildGoogleMapsSearchUrl } from '@/lib/maps';

type FoodSpot = {
  id: string;
  emoji: string;
  name: string;
  subtitle: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  price: '$' | '$$' | '$$$';
  tags: string[];
  area: 'hidden' | 'locals';
  aiSummary: string;
  mapsQuery: string;
  note: string;
  phone?: string;
  website?: string;
};

function FoodDiscoverySkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
        <div className="h-10 rounded-xl border border-border/60 bg-background/80" />
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`chip-skeleton-${idx}`} className="h-6 w-24 rounded-full bg-secondary/70" />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 h-4 w-32 rounded bg-secondary/70" />
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`hidden-skeleton-${idx}`} className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="h-4 w-36 rounded bg-secondary/70" />
              <div className="mt-2 h-3 w-24 rounded bg-secondary/60" />
              <div className="mt-4 h-3 w-48 rounded bg-secondary/60" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 h-4 w-36 rounded bg-secondary/70" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`locals-skeleton-${idx}`} className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="h-4 w-40 rounded bg-secondary/70" />
              <div className="mt-2 h-3 w-32 rounded bg-secondary/60" />
              <div className="mt-4 h-3 w-56 rounded bg-secondary/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildFoodSummary(spot: FoodSpot): string {
  const style = spot.tags.includes('Vegetarian') ? 'vegetarian-friendly' : 'local favorite';
  return `Good ${style} option nearby with practical access. Great pick if you want something reliable around ${spot.distanceKm.toFixed(1)} km away.`;
}

function resolvePrice(cuisine: string): '$' | '$$' | '$$$' {
  const value = cuisine.toLowerCase();
  if (value.includes('fine') || value.includes('fusion')) return '$$$';
  if (value.includes('seafood') || value.includes('japanese') || value.includes('korean')) return '$$';
  return '$';
}

function toFoodSpots(
  data: Record<string, TravelPlace[]>,
  coords: { lat: number; lng: number },
): FoodSpot[] {
  const emojiByType: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    fast_food: '🍔',
    food_court: '🍜',
    bar: '🍹',
    pub: '🍺',
  };
  const foodTypes = ['restaurant', 'cafe', 'fast_food'];
  const pool = foodTypes.flatMap((type) => data[type] ?? []);
  return pool
    .filter((place) => place.name && place.name !== 'Unknown')
    .slice(0, 16)
    .map((place, index) => {
      const distanceKm = calculateDistanceKm(coords, { lat: place.lat, lng: place.lon });
      const cuisine = place.tags.cuisine
        ? place.tags.cuisine
            .split(';')
            .slice(0, 2)
            .map((part) => part.trim())
            .join(', ')
        : 'Local food';
      const price = resolvePrice(cuisine);
      const rating = Number((4.5 + ((index % 5) * 0.1)).toFixed(1));
      const area: 'hidden' | 'locals' = distanceKm <= 1.5 ? 'hidden' : 'locals';
      const tags = [
        distanceKm <= 1 ? 'Under 1 km' : 'Worth the short ride',
        cuisine.toLowerCase().includes('vegetarian') ? 'Vegetarian' : 'Local favorite',
      ];
      const spot: FoodSpot = {
        id: `${place.id}-${place.type}`,
        emoji: emojiByType[place.type] || '🍴',
        name: place.name,
        subtitle: cuisine,
        rating,
        reviews: 120 + index * 17,
        distanceKm,
        price,
        tags,
        area,
        aiSummary: '',
        mapsQuery: toLatLngQuery({ lat: place.lat, lng: place.lon }),
        note: place.tags.opening_hours || 'Check opening time before visit',
        phone: place.tags.phone || place.tags['contact:phone'],
        website: place.tags.website || place.tags['contact:website'],
      };
      spot.aiSummary = buildFoodSummary(spot);
      return spot;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function getSpotReviews(spot: FoodSpot) {
  return [
    {
      name: 'Sarah M.',
      text: `${spot.name} had great flavor and quick service. Perfect if you are nearby.`,
      helpful: 24,
      label: 'Traveler',
    },
    {
      name: 'Somchai T.',
      text: `Good local pick. ${spot.subtitle} options are solid and value is fair.`,
      helpful: 18,
      label: 'Local',
    },
    {
      name: 'Mike R.',
      text: `Nice place overall. Best to check timing first: ${spot.note}.`,
      helpful: 12,
      label: 'Traveler',
    },
  ];
}

export default function FoodPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [coords, setCoords] = useState(DEFAULT_TRAVEL_COORDS);
  const [activeChip, setActiveChip] = useState<'all' | 'budget' | 'nearby' | 'vegetarian' | 'spicy'>('all');

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setCoords(DEFAULT_TRAVEL_COORDS);
      },
      GEOLOCATION_OPTIONS,
    );
  }, []);

  const { data, isLoading, isFetching, isError } = useFoodInfoQuery({
    lat: coords.lat,
    lng: coords.lng,
    search: query.trim().length > 0 ? query : undefined,
  });

  const spots = useMemo(() => toFoodSpots(data?.data ?? {}, coords), [coords, data]);
  const filtered = useMemo(() => {
    if (activeChip === 'all') return spots;
    if (activeChip === 'budget') return spots.filter((spot) => spot.price === '$');
    if (activeChip === 'nearby') return spots.filter((spot) => spot.distanceKm <= 1);
    if (activeChip === 'vegetarian') {
      return spots.filter(
        (spot) =>
          spot.tags.some((tag) => tag.toLowerCase().includes('vegetarian')) ||
          spot.subtitle.toLowerCase().includes('vegetarian'),
      );
    }
    return spots.filter((spot) => spot.subtitle.toLowerCase().includes('spicy'));
  }, [activeChip, spots]);
  const spot = spots.find((s) => s.id === selected) ?? null;
  const splitIndex = Math.ceil(filtered.length / 2);
  const hiddenGems = filtered.slice(0, splitIndex);
  const localsLove = filtered.slice(splitIndex);
  const reviews = spot ? getSpotReviews(spot) : [];
  const openMaps = (mapsQuery: string) => window.open(buildGoogleMapsSearchUrl(mapsQuery), '_blank');
  const isInitialLoading = isLoading && spots.length === 0;
  const isRefreshing = isFetching && !isInitialLoading;
  const chips = [
    { id: 'all' as const, label: 'All', count: spots.length },
    { id: 'budget' as const, label: 'Budget-friendly', count: spots.filter((spot) => spot.price === '$').length },
    { id: 'nearby' as const, label: 'Under 1 km', count: spots.filter((spot) => spot.distanceKm <= 1).length },
    {
      id: 'vegetarian' as const,
      label: 'Vegetarian',
      count: spots.filter(
        (spot) =>
          spot.tags.some((tag) => tag.toLowerCase().includes('vegetarian')) ||
          spot.subtitle.toLowerCase().includes('vegetarian'),
      ).length,
    },
    { id: 'spicy' as const, label: 'Spicy', count: spots.filter((spot) => spot.subtitle.toLowerCase().includes('spicy')).length },
  ];

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
              {isRefreshing ? (
                <p className="text-xs text-muted-foreground">Updating nearby food spots...</p>
              ) : null}
              {isError ? <p className="text-sm text-rose-500">Could not fetch live food spots right now.</p> : null}
              {isInitialLoading ? <FoodDiscoverySkeleton /> : null}
              {isInitialLoading ? null : (
              <>
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
                  {chips.map((chip) => (
                    <button
                      type="button"
                      onClick={() => setActiveChip(chip.id)}
                      key={chip.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        activeChip === chip.id
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                          : 'border border-border/70 bg-secondary/75 text-foreground hover:bg-secondary dark:text-white'
                      }`}
                    >
                      {chip.label} {chip.count > 0 ? `(${chip.count})` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {!isLoading && filtered.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-background/70 p-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">No spots match this filter yet.</p>
                  <p className="mt-1">
                    Try clearing search or selecting another chip to see nearby live options.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setActiveChip('all');
                    }}
                    className="mt-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Reset filters
                  </button>
                </div>
              ) : null}

              {!isLoading && hiddenGems.length > 0 ? (
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
                        ⭐ {s.rating} ({s.reviews}) • 📍 {s.distanceKm.toFixed(1)} km • {s.price}
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
              ) : null}

              {!isLoading && localsLove.length > 0 ? (
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
                        ⭐ {s.rating} ({s.reviews}) • 📍 {s.distanceKm.toFixed(1)} km • {s.price}
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
              ) : null}
              </>
              )}
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
                  ⭐ {spot.rating} ({spot.reviews}) • <MapPin className="inline h-3 w-3" /> {spot.distanceKm.toFixed(1)} km •{' '}
                  {spot.price} • <Clock3 className="inline h-3 w-3" /> {spot.note}
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
                  onClick={() => openMaps(spot.mapsQuery)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white"
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      void navigator.share({
                        title: spot.name,
                        text: `Check out ${spot.name}`,
                        url: buildGoogleMapsSearchUrl(spot.mapsQuery),
                      });
                      return;
                    }
                    openMaps(spot.mapsQuery);
                  }}
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
