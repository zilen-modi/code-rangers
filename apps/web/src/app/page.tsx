'use client';

import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { QuickActions } from '@/components/travel/quick-actions';
import { Sidebar } from '@/components/travel/sidebar';
import { SuggestionCard } from '@/components/travel/suggestion-card';
import { TopBanner } from '@/components/travel/top-banner';
import { TipsCard } from '@/components/travel/tips-card';
import { suggestions } from '@/components/travel/travel-data';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { useState } from 'react';

export default function HomePage() {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-4 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      </div>
      <Sidebar />
      <section className="relative px-4 pb-12 pt-4 md:ml-72 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <TopBanner />
          <QuickActions />
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Smart Suggestions</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.title} suggestion={suggestion} />
              ))}
            </div>
          </div>
          <TipsCard />
        </div>
      </section>
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
