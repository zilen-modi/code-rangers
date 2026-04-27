'use client';

import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { Sidebar } from '@/components/travel/sidebar';
import {
  DEFAULT_TRAVEL_COORDS,
  ESSENTIALS_DEFAULT_COST,
  ESSENTIALS_DEFAULT_NOTE,
  GEOLOCATION_OPTIONS,
} from '@/config/travel';
import { useTravelInfoQuery } from '@/features/travel/hooks/use-travel-info-query';
import { TravelPlace } from '@/features/travel/types';
import { calculateDistanceKm, formatDistanceKm, toLatLngQuery } from '@/lib/geo';
import { buildGoogleMapsSearchUrl } from '@/lib/maps';
import {
  ArrowLeft,
  BatteryCharging,
  Clock3,
  Landmark,
  MapPin,
  MapPinned,
  Navigation,
  Search,
  Share2,
  ShieldPlus,
  Star,
  Toilet,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

const EssentialsMap = dynamic(
  () => import('@/components/travel/essentials-map').then((m) => m.EssentialsMap),
  { ssr: false },
);

type CategoryKey = string;

type EssentialLocation = {
  id: number;
  name: string;
  type: CategoryKey;
  distance: string;
  cost: string;
  tag: string;
  note: string;
  cuisine?: string;
  phone?: string;
  website?: string;
  address?: string;
  photoUrl?: string;
  mapsQuery: string;
  lat: number;
  lng: number;
};

type PlaceReview = {
  name: string;
  text: string;
  helpful: number;
  label: 'Traveler' | 'Local' | 'Verified';
};

const DEFAULT_CATEGORY_ORDER = ['charging_station', 'atm', 'fuel', 'toilets'] as const;
const FALLBACK_CATEGORY_ICON_CLASS = 'from-violet-500 to-fuchsia-500';

const categoryStyleMap: Record<
  string,
  { label: string; icon: typeof BatteryCharging; iconClass: string }
> = {
  charging_station: {
    label: 'Charging',
    icon: BatteryCharging,
    iconClass: 'from-amber-500 to-orange-500',
  },
  atm: {
    label: 'ATM',
    icon: Landmark,
    iconClass: 'from-emerald-500 to-green-600',
  },
  fuel: {
    label: 'Petrol',
    icon: MapPinned,
    iconClass: 'from-sky-500 to-blue-600',
  },
  toilets: {
    label: 'Toilets',
    icon: Toilet,
    iconClass: 'from-cyan-500 to-teal-600',
  },
};

function toCategoryLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCategoryStyle(key: string) {
  const mapped = categoryStyleMap[key];
  if (mapped) return mapped;

  if (key.includes('toilet') || key.includes('restroom')) {
    return {
      label: 'Toilets',
      icon: Toilet,
      iconClass: 'from-cyan-500 to-teal-600',
    };
  }

  return {
    label: toCategoryLabel(key),
    icon: ShieldPlus,
    iconClass: FALLBACK_CATEGORY_ICON_CLASS,
  };
}

function EssentialsLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="h-10 rounded-xl border border-border/60 bg-background/70" />
        <div className="h-10 w-52 rounded-xl border border-border/60 bg-background/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`category-skeleton-${idx}`}
            className="rounded-2xl border border-border/70 bg-background/70 p-5 dark:border-white/15 dark:bg-white/5"
          >
            <div className="mb-8 h-12 w-12 rounded-xl bg-secondary/80 dark:bg-white/10" />
            <div className="h-4 w-24 rounded bg-secondary/80 dark:bg-white/10" />
            <div className="mt-2 h-3 w-16 rounded bg-secondary/60 dark:bg-white/10" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border/70 bg-background/70 dark:border-white/15 dark:bg-white/5" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`location-skeleton-${idx}`}
            className="rounded-xl border border-border/70 bg-background/70 p-4 dark:border-white/15 dark:bg-white/5"
          >
            <div className="h-4 w-40 rounded bg-secondary/80 dark:bg-white/10" />
            <div className="mt-2 h-3 w-32 rounded bg-secondary/60 dark:bg-white/10" />
            <div className="mt-4 h-9 w-full rounded-full bg-secondary/80 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function buildReviews(location: EssentialLocation): PlaceReview[] {
  return [
    {
      name: 'Aarav K.',
      text: `Very useful stop. ${location.name} was easy to find and close by.`,
      helpful: 19,
      label: 'Traveler',
    },
    {
      name: 'Nok S.',
      text: location.note.toLowerCase().includes('open')
        ? 'Good timing and easy access. Locals use this place regularly.'
        : 'Reliable place, but verify opening hours before heading there.',
      helpful: 12,
      label: 'Local',
    },
    {
      name: 'Maya R.',
      text: location.cuisine
        ? `Nice option if you want ${location.cuisine}. Clean and convenient location.`
        : 'Helpful option in this area, especially when you need something quickly.',
      helpful: 8,
      label: 'Verified',
    },
  ];
}

function toCategoryLocations(
  places: TravelPlace[] | undefined,
  type: CategoryKey,
  userCoords: { lat: number; lng: number },
): EssentialLocation[] {
  if (places === undefined || places.length === 0) {
    return [];
  }

  const resolvePhotoUrl = (tags: Record<string, string>): string | undefined => {
    const direct = tags.image || tags['image:url'];
    if (direct && /^https?:\/\//i.test(direct)) {
      return direct;
    }

    const commons = tags.wikimedia_commons;
    if (commons) {
      const normalized = commons.startsWith('File:') ? commons : `File:${commons}`;
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(normalized)}`;
    }

    return undefined;
  };

  const resolveAddress = (tags: Record<string, string>): string | undefined => {
    const parts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:postcode'],
    ].filter(Boolean);
    if (parts.length === 0) {
      return undefined;
    }
    return parts.join(', ');
  };

  return places.map((place) => {
    const distanceKm = calculateDistanceKm(userCoords, { lat: place.lat, lng: place.lon });
    const tag = place.tags.amenity || place.tags.tourism || place.type || 'Nearby';

    return {
      id: place.id,
      name: place.name || 'Unknown place',
      type,
      distance: formatDistanceKm(distanceKm),
      cost: ESSENTIALS_DEFAULT_COST,
      tag,
      note: place.tags.opening_hours || ESSENTIALS_DEFAULT_NOTE,
      cuisine: place.tags.cuisine,
      phone: place.tags.phone || place.tags['contact:phone'],
      website: place.tags.website || place.tags['contact:website'],
      address: resolveAddress(place.tags),
      photoUrl: resolvePhotoUrl(place.tags),
      mapsQuery: toLatLngQuery({ lat: place.lat, lng: place.lon }),
      lat: place.lat,
      lng: place.lon,
    };
  });
}

export default function EssentialsPage() {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('charging_station');
  const [showMap, setShowMap] = useState(true);
  const [coords, setCoords] = useState(DEFAULT_TRAVEL_COORDS);
  const [categorySearch, setCategorySearch] = useState('');
  const [sortMode, setSortMode] = useState<'nearest' | 'open_now'>('nearest');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<EssentialLocation | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('geolocation' in navigator) {
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
    }
  }, []);

  const { data, isLoading, isError } = useTravelInfoQuery({
    lat: coords.lat,
    lng: coords.lng,
    type: 'essentials',
  });

  const locationsByCategory = useMemo(() => {
    const source = data?.data;
    if (source === undefined) {
      return {} as Record<string, EssentialLocation[]>;
    }

    return Object.entries(source).reduce<Record<string, EssentialLocation[]>>((acc, [key, places]) => {
      acc[key] = toCategoryLocations(places, key, coords);
      return acc;
    }, {});
  }, [coords, data]);

  const categoryCards = useMemo(() => {
    const dynamicKeys = Object.keys(locationsByCategory);
    const orderedKeys = [
      ...DEFAULT_CATEGORY_ORDER.filter((key) => dynamicKeys.includes(key)),
      ...dynamicKeys.filter((key) => !DEFAULT_CATEGORY_ORDER.includes(key as (typeof DEFAULT_CATEGORY_ORDER)[number])),
    ];

    return orderedKeys.map((key) => {
      const style = getCategoryStyle(key);
      return {
        key,
        label: style.label,
        icon: style.icon,
        iconClass: style.iconClass,
        count: locationsByCategory[key]?.length ?? 0,
      };
    }).filter((category) => {
      if (categorySearch.trim().length === 0) return true;
      return category.label.toLowerCase().includes(categorySearch.trim().toLowerCase());
    });
  }, [categorySearch, locationsByCategory]);

  const visibleCategoryCards = useMemo(() => {
    if (showAllCategories || categorySearch.trim().length > 0) {
      return categoryCards;
    }
    return categoryCards.slice(0, 6);
  }, [categoryCards, categorySearch, showAllCategories]);

  useEffect(() => {
    if (categoryCards.length === 0) return;
    if (!categoryCards.some((category) => category.key === activeCategory)) {
      setActiveCategory(categoryCards[0].key);
    }
  }, [activeCategory, categoryCards]);

  const filteredLocations = useMemo(() => {
    const base = locationsByCategory[activeCategory] ?? [];
    if (sortMode === 'open_now') {
      return [...base].sort((a, b) => {
        const aOpen = a.note.toLowerCase().includes('open');
        const bOpen = b.note.toLowerCase().includes('open');
        if (aOpen === bOpen) return 0;
        return aOpen ? -1 : 1;
      });
    }
    return [...base].sort((a, b) => {
      const aValue = Number.parseFloat(a.distance);
      const bValue = Number.parseFloat(b.distance);
      if (Number.isNaN(aValue) || Number.isNaN(bValue)) return 0;
      return aValue - bValue;
    });
  }, [activeCategory, locationsByCategory, sortMode]);

  const openLocationMap = (query: string) => {
    window.open(buildGoogleMapsSearchUrl(query), '_blank');
  };
  const locationReviews = useMemo(
    () => (selectedLocation ? buildReviews(selectedLocation) : []),
    [selectedLocation],
  );

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <Sidebar />
      <section className="relative px-4 pb-12 pt-4 md:ml-72 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {selectedLocation ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedLocation(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-secondary/70"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-36 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-violet-500/40 to-fuchsia-500/40">
                {selectedLocation.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedLocation.photoUrl} alt={selectedLocation.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <article className="-mt-10 rounded-xl border border-border/60 bg-background/80 p-4">
                <h2 className="text-lg font-semibold">{selectedLocation.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedLocation.tag}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Star className="inline h-3 w-3 text-amber-500" /> 4.6 • <MapPin className="inline h-3 w-3" />{' '}
                  {selectedLocation.distance} • {selectedLocation.cost} • <Clock3 className="inline h-3 w-3" />{' '}
                  {selectedLocation.note}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[
                    selectedLocation.cuisine ? selectedLocation.cuisine : null,
                    selectedLocation.address ? 'Address available' : null,
                    selectedLocation.website ? 'Website' : null,
                  ]
                    .filter(Boolean)
                    .map((tag) => (
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
                <p className="text-sm font-semibold">✨ Place Details</p>
                <div className="mt-2 space-y-1 text-sm text-foreground/85">
                  {selectedLocation.cuisine ? <p><span className="font-medium">Cuisine:</span> {selectedLocation.cuisine}</p> : null}
                  {selectedLocation.phone ? <p><span className="font-medium">Phone:</span> {selectedLocation.phone}</p> : null}
                  {selectedLocation.website ? (
                    <p>
                      <span className="font-medium">Website:</span>{' '}
                      <a href={selectedLocation.website} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                        Open website
                      </a>
                    </p>
                  ) : null}
                  {selectedLocation.address ? <p><span className="font-medium">Address:</span> {selectedLocation.address}</p> : null}
                </div>
              </article>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Reviews ({locationReviews.length})</h3>
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
                  {locationReviews.map((review) => (
                    <article key={`${selectedLocation.id}-${review.name}`} className="rounded-xl border border-border/60 bg-background/80 p-4">
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
                      <p className="mt-1 text-xs text-amber-500 dark:text-yellow-300">★ ★ ★ ★ ☆</p>
                      <p className="mt-2 text-sm text-foreground/85">{review.text}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Helpful ({review.helpful})</p>
                    </article>
                  ))}
                </div>
              </section>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openLocationMap(selectedLocation.mapsQuery)}
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
                        title: selectedLocation.name,
                        text: `Check out ${selectedLocation.name}`,
                        url: buildGoogleMapsSearchUrl(selectedLocation.mapsQuery),
                      });
                      return;
                    }
                    window.open(buildGoogleMapsSearchUrl(selectedLocation.mapsQuery), '_blank');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-secondary/80 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </>
          ) : (
            <>
              <header>
                <h1 className="text-2xl font-semibold">Essentials Nearby</h1>
                <p className="text-sm text-muted-foreground">
                  Find what you need, right when you need it
                </p>
              </header>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    placeholder="Search categories..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </label>
                <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSortMode('nearest')}
                    className={`rounded-lg px-3 py-1.5 font-medium ${sortMode === 'nearest' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' : 'text-foreground/80'}`}
                  >
                    Nearest
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortMode('open_now')}
                    className={`rounded-lg px-3 py-1.5 font-medium ${sortMode === 'open_now' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' : 'text-foreground/80'}`}
                  >
                    Open now
                  </button>
                </div>
              </div>
              <div className="sticky top-16 z-10 -mx-1 flex gap-2 overflow-x-auto border-y border-border/50 bg-background/85 px-1 py-2 md:hidden">
                {categoryCards.map((category) => (
                  <button
                    key={`mobile-${category.key}`}
                    type="button"
                    onClick={() => setActiveCategory(category.key)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                      activeCategory === category.key
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                        : 'border border-border/60 bg-secondary/80 text-foreground'
                    }`}
                  >
                    {category.label} ({category.count})
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleCategoryCards.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.key;
                  return (
                    <button
                      key={category.label}
                      type="button"
                      onClick={() => setActiveCategory(category.key)}
                      className={`rounded-2xl border p-5 backdrop-blur-xl transition hover:-translate-y-0.5 ${isActive ? 'border-primary/30 bg-gradient-to-br from-primary/20 to-accent/15 shadow-[0_0_0_1px_hsl(var(--primary)/0.14),0_14px_34px_rgba(0,0,0,0.2)]' : 'border-border/70 bg-background/70 dark:border-white/15 dark:bg-white/5'}`}
                    >
                      <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/70 dark:bg-white/10">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${category.iconClass}`}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90">{category.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {category.count} nearby
                      </p>
                    </button>
                  );
                })}
              </div>
              {categorySearch.trim().length === 0 && categoryCards.length > 6 ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((prev) => !prev)}
                    className="rounded-full border border-border/60 bg-secondary/80 px-4 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  >
                    {showAllCategories
                      ? 'Show fewer categories'
                      : `Show more categories (${categoryCards.length - 6})`}
                  </button>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{filteredLocations.length} locations found</p>
                <button
                  type="button"
                  onClick={() => setShowMap((p) => (p ? false : true))}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <MapPinned className="h-3.5 w-3.5" />
                  {showMap ? 'Hide Map' : 'Map View'}
                </button>
              </div>

              {isLoading ? <EssentialsLoadingSkeleton /> : null}
              {isError ? (
                <p className="text-sm text-rose-500">Could not fetch live essentials at the moment.</p>
              ) : null}

              {isLoading ? null : showMap ? <EssentialsMap locations={filteredLocations} /> : null}

              {isLoading ? null : <div className="space-y-3">
                {filteredLocations.map((location) => (
                  <article
                    key={`${location.id}-${location.type}-${location.name}-${location.lat}-${location.lng}`}
                    className="rounded-xl border border-border/70 bg-background/70 p-3 backdrop-blur-xl dark:border-white/15 dark:bg-white/5"
                  >
                    {location.photoUrl ? (
                      <div className="mb-3 overflow-hidden rounded-lg border border-border/60 bg-background/75">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={location.photoUrl}
                          alt={location.name}
                          className="h-36 w-full object-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null}
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{location.name}</h3>
                          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-700 dark:text-green-400">
                            {location.tag}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {location.distance} • {location.cost}
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                          ● {location.note}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLocation(location)}
                        className="rounded-md border border-border/60 bg-secondary/80 px-2 py-1 text-[10px] font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                      >
                        Details
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLocationMap(location.mapsQuery)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      <Navigation className="h-4 w-4" />
                      Navigate
                    </button>
                  </article>
                ))}
                {isLoading || filteredLocations.length > 0 ? null : (
                  <p className="text-sm text-muted-foreground">
                    No places in this category for current location.
                  </p>
                )}
              </div>}
            </>
          )}
        </div>
      </section>
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
