'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTravelInfoQuery } from '@/features/travel/hooks/use-travel-info-query';
import { getLocationErrorMessage, requestCurrentPosition } from '@/lib/location';
import { TravelCategory } from '@/features/travel/types';

type Coords = { lat: number; lng: number } | null;

type SosContextValue = {
  coords: Coords;
  locationError: string | null;
  categories: TravelCategory[];
  isLoading: boolean;
  isError: boolean;
  requestLocation: () => Promise<void>;
};

const SosContext = createContext<SosContextValue | undefined>(undefined);

export function SosProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const requestLocation = async () => {
    try {
      setIsRequestingLocation(true);
      setLocationError(null);
      const currentPosition = await requestCurrentPosition();
      setCoords(currentPosition);
    } catch (error) {
      setLocationError(getLocationErrorMessage(error));
      setCoords(null);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      isLoading: isLoading || isRequestingLocation,
      isError,
      requestLocation,
    }),
    [coords, data, isError, isLoading, isRequestingLocation, locationError],
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
