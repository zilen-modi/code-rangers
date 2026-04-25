'use client';

import { motion } from 'framer-motion';
import { Camera, Loader2, Sparkles, Upload } from 'lucide-react';

export function ScanPreviewCard({
  previewUrl,
  isTranslating,
  onUpload,
  onTranslateAll,
  onRescan,
}: {
  previewUrl: string | null;
  isTranslating: boolean;
  onUpload: () => void;
  onTranslateAll: () => void;
  onRescan: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white/5 p-4 shadow-[0_0_0_1px_hsl(var(--primary)/0.12),0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-end gap-2">
        <button type="button" onClick={onTranslateAll} disabled={isTranslating} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white transition hover:shadow-[0_0_24px_rgba(217,70,239,0.45)]">
          {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Translate All
        </button>
        <button type="button" onClick={onRescan} className="rounded-full border border-border/70 bg-secondary/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary dark:border-white/15 dark:bg-white/10 dark:text-white">
          Rescan
        </button>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-background/70 ring-1 ring-primary/10">
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Scanned menu preview" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-black/30" />
          </>
        ) : (
          <div className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/25 ring-1 ring-primary/30">
              <Camera className="h-7 w-7 text-foreground/90" />
            </div>
            <p className="text-sm text-muted-foreground">Upload or capture menu</p>
            <button type="button" onClick={onUpload} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary dark:border-white/15 dark:bg-white/10 dark:text-white">
              <Upload className="h-4 w-4" />
              Choose Image
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}
