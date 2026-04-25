'use client';

import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { UserProvider } from '@/providers/user-provider';
import { SosProvider } from '@/providers/sos-provider';
import { WeatherProvider } from '@/providers/weather-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <UserProvider>
          <SosProvider>
            <WeatherProvider>
              {children}
              <Toaster richColors position="top-right" closeButton />
            </WeatherProvider>
          </SosProvider>
        </UserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
