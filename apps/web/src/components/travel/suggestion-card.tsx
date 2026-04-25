'use client';

import { motion } from 'framer-motion';
import { Suggestion } from './travel-data';

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <motion.article whileHover={{ scale: 1.02, y: -1 }} transition={{ duration: 0.18 }} className={`rounded-2xl border border-border/60 bg-gradient-to-br ${suggestion.gradientClassName} p-4`}>
      <div className="mb-2 text-lg">{suggestion.emoji}</div>
      <h3 className="text-sm font-semibold text-foreground">{suggestion.title}</h3>
      <p className="mt-1 text-xs text-foreground/75">{suggestion.subtitle}</p>
      <span className="mt-3 inline-flex rounded-lg border border-border/70 bg-background/40 px-2 py-1 text-[11px] text-foreground/80">{suggestion.tag}</span>
    </motion.article>
  );
}
