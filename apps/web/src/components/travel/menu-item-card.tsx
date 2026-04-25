import { Flame } from 'lucide-react';
import { ScanMenuItem } from './scan-data';

export function MenuItemCard({ item }: { item: ScanMenuItem }) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/35">
      {item.recommended && <p className="mb-2 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300">✨ You should try this</p>}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.original}</p>
        </div>
        <div className="flex items-center gap-1 text-red-400">
          {Array.from({ length: item.spice }).map((_, idx) => <Flame key={`${item.name}-${idx}`} className="h-4 w-4 fill-current" />)}
          {item.spice === 0 && <span className="text-xs text-muted-foreground">Mild</span>}
        </div>
      </div>
      <p className="mt-3 text-sm text-foreground/80 dark:text-white/80">{item.description}</p>
      {item.allergens.length > 0 && <div className="mt-3 rounded-lg border border-orange-300/20 bg-orange-500/10 px-3 py-2 text-xs text-orange-700 dark:text-orange-300">⚠ Contains: {item.allergens.join(', ')}</div>}
    </article>
  );
}
