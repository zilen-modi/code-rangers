'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { navItems } from './travel-data';

function SidebarPanel({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm backdrop-blur-xl dark:bg-white/5">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                router.push(item.href);
                onNavigate?.();
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground shadow-[0_0_24px_hsl(var(--primary)/0.25)]'
                  : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Connected
        </div>
        <p className="text-xs text-emerald-700/80 dark:text-emerald-100/80">Bangkok, Thailand</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('travel-sidebar-open', open);
    return () => window.removeEventListener('travel-sidebar-open', open);
  }, []);
  return (
    <>
      <div className="fixed bottom-4 left-4 top-20 z-20 hidden w-64 md:block">
        <SidebarPanel />
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="relative m-4 h-[calc(100%-2rem)] w-72">
            <button type="button" onClick={() => setIsOpen(false)} className="absolute right-3 top-3 z-10 rounded-lg bg-background/80 p-1.5 text-foreground/80 dark:bg-white/10" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
            <SidebarPanel onNavigate={() => setIsOpen(false)} />
          </motion.div>
        </div>
      )}
    </>
  );
}
