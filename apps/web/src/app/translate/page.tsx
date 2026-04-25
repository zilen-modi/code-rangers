'use client';

import { useState } from 'react';
import { Camera, Mic, Repeat2, Sparkles, Type, Upload } from 'lucide-react';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { Sidebar } from '@/components/travel/sidebar';

type Mode = 'text' | 'voice' | 'image';

export default function TranslatePage() {
  const [mode, setMode] = useState<Mode>('text');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const tabs = [{ id: 'text' as const, label: 'Text', icon: Type }, { id: 'voice' as const, label: 'Voice', icon: Mic }, { id: 'image' as const, label: 'Image', icon: Camera }];

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <Sidebar />
      <section className="relative px-4 pb-12 pt-4 md:ml-72 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <header><h1 className="text-2xl font-semibold">Live Translator</h1><p className="text-sm text-muted-foreground">Translate text, voice, and images instantly</p></header>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-background/80 p-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = mode === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => setMode(t.id)} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' : 'text-foreground/80 hover:bg-secondary/70 hover:text-foreground dark:text-muted-foreground dark:hover:bg-white/10 dark:hover:text-white'}`}>
                    <Icon className="h-4 w-4" />{t.label}
                  </button>
                );
              })}
            </div>
            {mode === 'text' && (
              <div className="mt-3 space-y-3">
                <div className="grid items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
                  <select className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"><option>English</option></select>
                  <button type="button" className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"><Repeat2 className="h-4 w-4" /></button>
                  <select className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"><option>Thai</option></select>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/75 p-3"><textarea placeholder="Type what you want to say..." className="h-32 w-full resize-none bg-transparent text-sm outline-none" /></div>
              </div>
            )}
            {mode === 'voice' && <div className="mt-3 flex h-52 items-center justify-center rounded-xl border border-border/60 bg-background/75"><button type="button" className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"><Mic className="h-8 w-8" /></button></div>}
            {mode === 'image' && (
              <div className="mt-3 space-y-3">
                <button type="button" className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"><Upload className="h-3.5 w-3.5" />New Image</button>
                <div className="flex h-[420px] items-center justify-center rounded-xl border border-border/60 bg-background/75"><span className="text-6xl opacity-35">🍜</span></div>
              </div>
            )}
          </div>
          <section>
            <h2 className="mb-3 text-sm font-medium">Quick Travel Phrases</h2>
            <div className="flex flex-wrap gap-2">
              {['Where is the nearest ATM?', 'No peanuts please', 'How much does this cost?', 'I need help'].map((p) => (
                <button key={p} type="button" className="rounded-full border border-border/60 bg-secondary/75 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">{p}</button>
              ))}
            </div>
          </section>
        </div>
      </section>
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
