'use client';

import { CloudSun } from 'lucide-react';
import { useWeatherData } from '@/providers/weather-provider';

export function TopBanner() {
  const { city, country, temperatureText, weatherText, isLoading } = useWeatherData();
  const locationText = country ? `${city}, ${country}` : city;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/25 p-6 shadow-[0_0_40px_hsl(var(--primary)/0.2)] backdrop-blur-xl">
      <p className="text-sm text-foreground/75">Good afternoon in</p>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {locationText}
        </h1>
        <CloudSun className="h-6 w-6 text-yellow-300" />
      </div>
      <p className="mt-2 text-sm text-foreground/80">
        {isLoading ? 'Loading weather...' : `${temperatureText} • ${weatherText}`}
      </p>
    </section>
  );
}
