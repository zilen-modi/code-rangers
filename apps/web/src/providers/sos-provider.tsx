'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTravelInfoQuery } from '@/features/travel/hooks/use-travel-info-query';
import { TravelCategory } from '@/features/travel/types';

type Coords = { lat: number; lng: number } | null;

type SosContextValue = {
  coords: Coords;
  locationError: string | null;
  categories: TravelCategory[];
  isLoading: boolean;
  isError: boolean;
};

const SosContext = createContext<SosContextValue | undefined>(undefined);

export function SosProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported on this device.');
      setCoords(null);
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationError('Location permission is required to fetch nearby SOS services.');
        setCoords(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  }, []);

  const { data, isLoading, isError } = useTravelInfoQuery<TravelCategory[]>(
    {
      lat: coords?.lat ?? 0,
      lng: coords?.lng ?? 0,
      type: 'sos',
    },
    coords !== null && locationError === null,
  );

  const value = useMemo<SosContextValue>(
    () => ({
      coords,
      locationError,
      categories: data?.data ?? [],
      isLoading,
      isError,
    }),
    [coords, data, isError, isLoading, locationError],
  );

  return <SosContext.Provider value={value}>{children}</SosContext.Provider>;
}

export function useSosData() {
  const context = useContext(SosContext);
  if (!context) {
    throw new Error('useSosData must be used within SosProvider');
  }
  return context;
}
