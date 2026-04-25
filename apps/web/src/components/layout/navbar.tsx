'use client';

import { Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@repo/ui/components/button';
import { Container } from './container';

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-16 items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-accent" />
          Code Rangers UI
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="transition-transform hover:-translate-y-0.5"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </Container>
    </header>
  );
}
