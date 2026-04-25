'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AIRecommendationCard } from '@/components/travel/ai-recommendation-card';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { MenuItemCard } from '@/components/travel/menu-item-card';
import type { ScanMenuItem } from '@/components/travel/scan-data';
import { ScanHeader } from '@/components/travel/scan-header';
import { ScanPreviewCard } from '@/components/travel/scan-preview-card';
import { Sidebar } from '@/components/travel/sidebar';
import { env } from '@/config/env';

type ApiMenuItem = {
  name: string;
  details: string;
  recommended: boolean;
};

type ApiMenuCategory = {
  category: 'veg' | 'non-veg';
  items: ApiMenuItem[];
};

type MenuAnalyzeResponse = {
  message: string;
  data: {
    requestId: string;
    menuCategories: ApiMenuCategory[];
    metadata?: Record<string, unknown>;
  };
};

async function prepareImageForUpload(file: File): Promise<File> {
  // Keep payload light for Ollama vision runner stability.
  const MAX_DIMENSION = 1280;
  const OUTPUT_QUALITY = 0.72;

  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(imageBitmap.width, imageBitmap.height));
  const targetWidth = Math.max(1, Math.round(imageBitmap.width * scale));
  const targetHeight = Math.max(1, Math.round(imageBitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    return file;
  }
  context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  imageBitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', OUTPUT_QUALITY);
  });
  if (!blob) {
    return file;
  }

  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'menu'}-compressed.jpg`, {
    type: 'image/jpeg',
  });
}

async function analyzeMenuRequest(file: File): Promise<MenuAnalyzeResponse> {
  const preparedFile = await prepareImageForUpload(file);
  const formData = new FormData();
  formData.append('image', preparedFile);

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/menu/analyze`, {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json()) as MenuAnalyzeResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload?.error || (payload as { message?: string })?.message || 'Menu analysis failed');
  }

  return payload;
}

function toScanMenuItems(categories: ApiMenuCategory[]): ScanMenuItem[] {
  return categories.flatMap((cat) =>
    cat.items.map((item) => ({
      name: item.name,
      original: cat.category === 'veg' ? '🌿 Vegetarian' : '🍖 Non-Vegetarian',
      description: item.details,
      spice: 0,
      allergens: [],
      recommended: item.recommended,
    })),
  );
}

export default function ScanPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [menuItems, setMenuItems] = useState<ScanMenuItem[]>([]);
  const [analyzeError, setAnalyzeError] = useState('');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = useMutation({
    mutationFn: analyzeMenuRequest,
    onSuccess: (result) => {
      setMenuItems(toScanMenuItems(result.data.menuCategories));
      setAnalyzeError('');
    },
    onError: (error: Error) => {
      setAnalyzeError(error.message || 'Menu analysis failed');
    },
  });

  const onUploadClick = () => fileInputRef.current?.click();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setMenuItems([]);
    setAnalyzeError('');
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    event.currentTarget.value = '';
  };

  const onTranslateAll = () => {
    if (!selectedFile || analyzeMutation.isPending) return;
    setAnalyzeError('');
    analyzeMutation.mutate(selectedFile);
  };

  const onRescan = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setMenuItems([]);
    setAnalyzeError('');
    analyzeMutation.reset();
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
          <ScanPreviewCard
            previewUrl={previewUrl}
            isTranslating={analyzeMutation.isPending}
            onUpload={onUploadClick}
            onTranslateAll={onTranslateAll}
            onRescan={onRescan}
          />
          {analyzeError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {analyzeError}
            </div>
          )}
          <AIRecommendationCard />
          {menuItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Menu Items ({menuItems.length})</h2>
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <MenuItemCard key={`${item.name}-${item.original}`} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
