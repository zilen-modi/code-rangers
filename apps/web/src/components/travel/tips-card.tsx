import { tips } from './travel-data';

export function TipsCard() {
  return (
    <section className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm backdrop-blur-xl dark:bg-white/5">
      <h2 className="mb-4 text-sm font-medium text-foreground/85">AI Tips for Today</h2>
      <div className="space-y-4">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.title} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="text-sm text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
