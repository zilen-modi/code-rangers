'use client';

import { useEffect, useRef, useState } from 'react';
import { AIRecommendationCard } from '@/components/travel/ai-recommendation-card';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { MenuItemCard } from '@/components/travel/menu-item-card';
import { initialMenuItems, translatedMenuItems } from '@/components/travel/scan-data';
import { ScanHeader } from '@/components/travel/scan-header';
import { ScanPreviewCard } from '@/components/travel/scan-preview-card';
import { Sidebar } from '@/components/travel/sidebar';

export default function ScanPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onUploadClick = () => fileInputRef.current?.click();
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
  };
  const onTranslateAll = () => {
    setIsTranslating(true);
    window.setTimeout(() => {
      setMenuItems(translatedMenuItems);
      setIsTranslating(false);
    }, 900);
  };
  const onRescan = () => {
    setPreviewUrl(null);
    setMenuItems(initialMenuItems);
    setIsTranslating(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-4 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      </div>
      <Sidebar />
      <section className="relative px-4 pb-12 pt-4 md:ml-72 md:px-8 md:pt-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <ScanHeader />
          <ScanPreviewCard previewUrl={previewUrl} isTranslating={isTranslating} onUpload={onUploadClick} onTranslateAll={onTranslateAll} onRescan={onRescan} />
          <AIRecommendationCard />
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Menu Items ({menuItems.length})</h2>
            <div className="space-y-3">
              {menuItems.map((item) => (
                <MenuItemCard key={item.name} item={item} />
              ))}
            </div>
          </section>
        </div>
      </section>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
