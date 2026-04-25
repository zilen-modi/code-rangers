import { Skeleton } from '@repo/ui/components/skeleton';

export function FormSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border p-6" data-premium-card="true">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
