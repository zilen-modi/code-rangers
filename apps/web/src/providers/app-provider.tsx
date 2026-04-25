'use client';

import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { UserProvider } from '@/providers/user-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <UserProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </UserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
