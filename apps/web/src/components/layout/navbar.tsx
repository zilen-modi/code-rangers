'use client';

import { useEffect, useState } from 'react';
import { Menu, Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Container } from './container';

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const travelRoutes = ['/', '/scan', '/essentials', '/assistant', '/translate', '/food'];
  const showSidebarMenuButton = travelRoutes.includes(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-16 items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-accent" />
          Code Rangers UI
        </div>

        <div className="flex items-center gap-2">
          {showSidebarMenuButton && (
            <Button
              variant="outline"
              size="sm"
              className="transition-transform hover:-translate-y-0.5 md:hidden"
              onClick={() => window.dispatchEvent(new Event('travel-sidebar-open'))}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="transition-transform hover:-translate-y-0.5"
          >
            {mounted && resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Container>
    </header>
  );
}
