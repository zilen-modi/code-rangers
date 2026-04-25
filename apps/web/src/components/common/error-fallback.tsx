'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@repo/ui/components/button';

export function ErrorFallback({
  title = 'Something went wrong',
  description = 'We hit an unexpected issue. Please retry.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center animate-fade-in"
      data-premium-card="true"
    >
      <AlertTriangle className="h-8 w-8 text-accent" />
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex gap-3">
        <Button onClick={onRetry}>Retry</Button>
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
