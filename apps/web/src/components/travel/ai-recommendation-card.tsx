export function AIRecommendationCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-violet-500/35 to-fuchsia-500/35 p-5 shadow-[0_0_0_1px_hsl(var(--primary)/0.1),0_14px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-foreground dark:text-white">AI Recommendation</h2>
      <p className="mt-2 text-sm text-foreground/85 dark:text-white/85">Based on your preferences, you should try Pad Thai - it&apos;s their specialty!</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">Tourist-friendly</span>
        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">Best seller</span>
      </div>
    </section>
  );
}
