'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/common/error-fallback';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return <ErrorFallback description={error.message} onRetry={reset} />;
}
