'use client';

import { useState } from 'react';
import { Send, Sparkles, Star, WandSparkles } from 'lucide-react';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { Sidebar } from '@/components/travel/sidebar';

export default function AssistantPage() {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const recommendations = [
    { name: 'Som Tam Stand', subtitle: 'Street Food', distance: '0.8 km', price: '$', rating: 4.8, tags: ['Local vibe', 'Fresh daily'] },
    { name: 'Krua Apsorn', subtitle: 'Traditional Thai', distance: '0.9 km', price: '$$', rating: 4.9, tags: ['Must try', 'Award-winning'] },
  ];

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <Sidebar />
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col px-4 pb-4 pt-4 md:ml-72 md:px-8 md:pt-6">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/85 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <header className="border-b border-border/50 px-5 py-4 dark:border-white/10">
            <h1 className="text-lg font-semibold">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Ask me anything about your trip</p>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
            <div className="mx-auto max-w-xl space-y-4">
              <div className="rounded-xl border border-border/60 bg-background/85 p-3 text-xs text-foreground/85 dark:border-white/10 dark:bg-white/5 dark:text-white/85">
                I found some great local spots for you! Here are my top recommendations:
              </div>
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-full border border-fuchsia-300/40 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white">
                  I want to try authentic Thai food
                </div>
              </div>
              {recommendations.map((item) => (
                <article key={item.name} className="rounded-xl border border-border/60 bg-background/85 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500"><Star className="h-3.5 w-3.5 fill-current" />{item.rating}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">📍 {item.distance} • {item.price}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-200">{tag}</span>)}</div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white">View Details</button>
                    <button type="button" className="inline-flex items-center justify-center rounded-full border border-border/70 bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground dark:border-white/15 dark:bg-white/10 dark:text-white">Navigate</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <footer className="border-t border-border/50 p-3 dark:border-white/10">
            <div className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-border/70 bg-background/90 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <input placeholder="Ask anything..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/80 text-foreground dark:border-white/10 dark:bg-white/10 dark:text-white"><WandSparkles className="h-3.5 w-3.5" /></button>
              <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"><Send className="h-3.5 w-3.5" /></button>
            </div>
          </footer>
        </div>
      </section>
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
