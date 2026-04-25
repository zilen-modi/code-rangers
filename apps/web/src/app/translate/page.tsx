'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Mic, Repeat2, Sparkles, Type, Upload } from 'lucide-react';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { Sidebar } from '@/components/travel/sidebar';
import { env } from '@/config/env';

type Mode = 'text' | 'voice' | 'image';

type LanguageOption = {
  value: string;
  label: string;
};

type TranslateResponse = {
  message: string;
  data: {
    requestId: string;
    translatedText: string;
    inputType: Mode;
    inputLanguage: string;
    responseLanguage: string;
  };
};

const languageOptions: LanguageOption[] = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'Thai', label: 'Thai' },
];

async function translateRequest(formData: FormData): Promise<TranslateResponse> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/translate`, {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json()) as TranslateResponse & { error?: string; message?: string };

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Translation failed');
  }

  return payload;
}

export default function TranslatePage() {
  const [mode, setMode] = useState<Mode>('text');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [inputLanguage, setInputLanguage] = useState('English');
  const [responseLanguage, setResponseLanguage] = useState('Thai');
  const [textValue, setTextValue] = useState('');
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedVoiceFile, setSelectedVoiceFile] = useState<File | null>(null);
  const [translatedOutputByMode, setTranslatedOutputByMode] = useState<Record<Mode, string>>({
    text: '',
    voice: '',
    image: '',
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const tabs = [{ id: 'text' as const, label: 'Text', icon: Type }, { id: 'voice' as const, label: 'Voice', icon: Mic }, { id: 'image' as const, label: 'Image', icon: Camera }];
  const translateMutation = useMutation({
    mutationFn: translateRequest,
    onSuccess: (result) => {
      setRequestId(result.data.requestId);
      setTranslatedOutputByMode((previous) => ({
        ...previous,
        [result.data.inputType]: result.data.translatedText,
      }));
    },
  });

  const runTextTranslation = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || translateMutation.isPending) return;

    const formData = new FormData();
    formData.append('inputLanguage', inputLanguage);
    formData.append('responseLanguage', responseLanguage);
    formData.append('text', trimmed);
    if (requestId) {
      formData.append('requestId', requestId);
    }

    await translateMutation.mutateAsync(formData);
  };

  const runFileTranslation = async (file: File, type: 'image' | 'voice') => {
    if (translateMutation.isPending) return;

    const formData = new FormData();
    formData.append('inputLanguage', inputLanguage);
    formData.append('responseLanguage', responseLanguage);
    formData.append(type, file);
    if (requestId) {
      formData.append('requestId', requestId);
    }

    await translateMutation.mutateAsync(formData);
  };

  const swapLanguages = () => {
    setInputLanguage(responseLanguage);
    setResponseLanguage(inputLanguage);
  };

  const handleSend = async () => {
    setTranslatedOutputByMode((previous) => ({
      ...previous,
      [mode]: '',
    }));

    if (mode === 'text') {
      await runTextTranslation(textValue);
      return;
    }

    if (mode === 'image' && selectedImageFile) {
      await runFileTranslation(selectedImageFile, 'image');
      return;
    }

    if (mode === 'voice' && selectedVoiceFile) {
      await runFileTranslation(selectedVoiceFile, 'voice');
    }
  };

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
                  <select
                    value={inputLanguage}
                    onChange={(event) => setInputLanguage(event.target.value)}
                    className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={swapLanguages} className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"><Repeat2 className="h-4 w-4" /></button>
                  <select
                    value={responseLanguage}
                    onChange={(event) => setResponseLanguage(event.target.value)}
                    className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/75 p-3">
                  <textarea
                    value={textValue}
                    onChange={(event) => setTextValue(event.target.value)}
                    placeholder="Type what you want to say..."
                    className="h-32 w-full resize-none bg-transparent text-sm outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={translateMutation.isPending || !textValue.trim()}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send
                </button>
                {translatedOutputByMode.text && (
                  <div className="rounded-xl border border-border/60 bg-background/75 p-3">
                    <p className="text-sm">{translatedOutputByMode.text}</p>
                  </div>
                )}
              </div>
            )}
            {mode === 'voice' && (
              <div className="mt-3 space-y-3">
                <div className="grid items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
                  <select
                    value={inputLanguage}
                    onChange={(event) => setInputLanguage(event.target.value)}
                    className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={swapLanguages} className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"><Repeat2 className="h-4 w-4" /></button>
                  <select
                    value={responseLanguage}
                    onChange={(event) => setResponseLanguage(event.target.value)}
                    className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex h-52 items-center justify-center rounded-xl border border-border/60 bg-background/75">
                  <button
                    type="button"
                    onClick={() => voiceInputRef.current?.click()}
                    className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                  >
                    <Mic className="h-8 w-8" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={translateMutation.isPending || !selectedVoiceFile}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send
                </button>
                {translatedOutputByMode.voice && (
                  <div className="rounded-xl border border-border/60 bg-background/75 p-3">
                    <p className="text-sm">{translatedOutputByMode.voice}</p>
                  </div>
                )}
              </div>
            )}
            {mode === 'image' && (
              <div className="mt-3 space-y-3">
                <div className="grid items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
                  <select
                    value={inputLanguage}
                    onChange={(event) => setInputLanguage(event.target.value)}
                    className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={swapLanguages} className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"><Repeat2 className="h-4 w-4" /></button>
                  <select
                    value={responseLanguage}
                    onChange={(event) => setResponseLanguage(event.target.value)}
                    className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <Upload className="h-3.5 w-3.5" />New Image
                </button>
                <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/75">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded translation input"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-6xl opacity-35">🍜</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={translateMutation.isPending || !selectedImageFile}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send
                </button>
                {translatedOutputByMode.image && (
                  <div className="rounded-xl border border-border/60 bg-background/75 p-3">
                    <p className="text-sm">{translatedOutputByMode.image}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <section>
            <h2 className="mb-3 text-sm font-medium">Quick Travel Phrases</h2>
            <div className="flex flex-wrap gap-2">
              {['Where is the nearest ATM?', 'No peanuts please', 'How much does this cost?', 'I need help'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setTextValue(p);
                  }}
                  className="rounded-full border border-border/60 bg-secondary/75 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
      <input
        ref={voiceInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setSelectedVoiceFile(file);
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setSelectedImageFile(file);
          setImagePreviewUrl((previousUrl) => {
            if (previousUrl) {
              URL.revokeObjectURL(previousUrl);
            }
            return URL.createObjectURL(file);
          });
          event.currentTarget.value = '';
        }}
      />
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
