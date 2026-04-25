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
import { BatteryCharging, Landmark, MapPinned, Navigation, Toilet } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

const EssentialsMap = dynamic(
  () => import('@/components/travel/essentials-map').then((m) => m.EssentialsMap),
  { ssr: false },
);

type CategoryKey = 'charging' | 'atm' | 'petrol' | 'toilets';

type EssentialLocation = {
  name: string;
  type: CategoryKey;
  distance: string;
  cost: string;
  tag: string;
  note: string;
  mapsQuery: string;
  lat: number;
  lng: number;
};

const quickCategories = [
  {
    key: 'charging' as const,
    label: 'Charging',
    icon: BatteryCharging,
    iconClass: 'from-amber-500 to-orange-500',
  },
  {
    key: 'atm' as const,
    label: 'ATM',
    icon: Landmark,
    iconClass: 'from-emerald-500 to-green-600',
  },
  {
    key: 'petrol' as const,
    label: 'Petrol',
    iconClass: 'from-sky-500 to-blue-600',
    icon: MapPinned,
  },
  {
    key: 'toilets' as const,
    label: 'Toilets',
    icon: Toilet,
    iconClass: 'from-violet-500 to-fuchsia-500',
  },
];

function toCategoryLocations(
  places: TravelPlace[] | undefined,
  type: CategoryKey,
  userCoords: { lat: number; lng: number },
): EssentialLocation[] {
  if (places === undefined || places.length === 0) {
    return [];
  }

  return places.map((place) => {
    const distanceKm = calculateDistanceKm(userCoords, { lat: place.lat, lng: place.lon });
    const tag = place.tags.amenity || place.tags.tourism || place.type || 'Nearby';

    return {
      name: place.name || 'Unknown place',
      type,
      distance: formatDistanceKm(distanceKm),
      cost: ESSENTIALS_DEFAULT_COST,
      tag,
      note: place.tags.opening_hours || ESSENTIALS_DEFAULT_NOTE,
      mapsQuery: toLatLngQuery({ lat: place.lat, lng: place.lon }),
      lat: place.lat,
      lng: place.lon,
    };
  });
}

export default function EssentialsPage() {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('charging');
  const [showMap, setShowMap] = useState(true);
  const [coords, setCoords] = useState(DEFAULT_TRAVEL_COORDS);

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

  const essentialLocations = useMemo(() => {
    const source = data?.data;
    if (source === undefined) {
      return [] as EssentialLocation[];
    }

    const categories: EssentialLocation[] = [
      ...toCategoryLocations(source.charging_station, 'charging', coords),
      ...toCategoryLocations(source.atm, 'atm', coords),
      ...toCategoryLocations(source.fuel, 'petrol', coords),
    ];
    return categories;
  }, [coords, data]);
  const filteredLocations = essentialLocations.filter((l) => l.type === activeCategory);
  const openLocationMap = (query: string) => {
    window.open(buildGoogleMapsSearchUrl(query), '_blank');
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <Sidebar />
      <section className="relative px-4 pb-12 pt-4 md:ml-72 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <header>
            <h1 className="text-2xl font-semibold">Essentials Nearby</h1>
            <p className="text-sm text-muted-foreground">
              Find what you need, right when you need it
            </p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickCategories.map((category) => {
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
                </button>
              );
            })}
          </div>
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

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Fetching nearby essentials...</p>
          ) : null}
          {isError ? (
            <p className="text-sm text-rose-500">Could not fetch live essentials at the moment.</p>
          ) : null}

          {showMap ? <EssentialsMap locations={filteredLocations} /> : null}

          <div className="space-y-3">
            {filteredLocations.map((location) => (
              <article
                key={`${location.type}-${location.name}-${location.lat}-${location.lng}`}
                className="rounded-xl border border-border/70 bg-background/70 p-3 backdrop-blur-xl dark:border-white/15 dark:bg-white/5"
              >
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
                    onClick={() => openLocationMap(location.mapsQuery)}
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
          </div>
        </div>
      </section>
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
