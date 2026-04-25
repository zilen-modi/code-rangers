'use client';

import { createContext, useContext, useMemo } from 'react';
import { useSosData } from '@/providers/sos-provider';
import { useWeatherInfoQuery } from '@/features/weather/hooks/use-weather-info-query';
import { WeatherData } from '@/features/weather/types';
import { formatTemperature, getWeatherDescription } from '@/lib/weather';

type WeatherContextValue = {
  weather: WeatherData | null;
  city: string;
  country: string;
  weatherText: string;
  temperatureText: string;
  isLoading: boolean;
  isError: boolean;
};

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const { coords } = useSosData();

  const { data, isLoading, isError } = useWeatherInfoQuery(
    {
      lat: coords?.lat ?? 0,
      lng: coords?.lng ?? 0,
    },
    coords !== null,
  );

  const weather = data?.data ?? null;
  const city = weather?.location?.city || 'Unknown city';
  const country = weather?.location?.country || '';
  const weatherText = getWeatherDescription(weather?.weathercode);
  const temperatureText = formatTemperature(weather?.temperature);

  const value = useMemo<WeatherContextValue>(
    () => ({
      weather,
      city,
      country,
      weatherText,
      temperatureText,
      isLoading,
      isError,
    }),
    [city, country, isError, isLoading, temperatureText, weather, weatherText],
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeatherData() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeatherData must be used within WeatherProvider');
  }
  return context;
}
