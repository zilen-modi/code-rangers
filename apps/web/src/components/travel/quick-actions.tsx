'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { quickActions } from './travel-data';

export function QuickActions() {
  const router = useRouter();

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick Actions</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={() => router.push(action.href)}
              className="group rounded-2xl border border-border/60 bg-background/70 p-6 shadow-sm backdrop-blur-xl dark:bg-white/5"
              type="button"
            >
              <div className={`mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.iconClassName}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-foreground/90">{action.label}</p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
