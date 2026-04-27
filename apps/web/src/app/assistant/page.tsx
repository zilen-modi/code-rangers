'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Send, Sparkles, Star, WandSparkles } from 'lucide-react';
import { EmergencyModal } from '@/components/travel/emergency-modal';
import { FloatingEmergencyButton } from '@/components/travel/floating-emergency-button';
import { Sidebar } from '@/components/travel/sidebar';
import { DEFAULT_TRAVEL_COORDS, GEOLOCATION_OPTIONS } from '@/config/travel';
import { useAssistantChatMutation } from '@/features/assistant/hooks/use-assistant-chat-mutation';
import { AssistantStructuredResponse } from '@/features/assistant/types';
import { ApiError } from '@/services/api-client';

type AssistantMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

function toDistanceValue(distance: string): number {
  const value = Number.parseFloat(distance);
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

export default function AssistantPage() {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [coords, setCoords] = useState(DEFAULT_TRAVEL_COORDS);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'initial-assistant',
      role: 'assistant',
      text: 'Hey! Tell me what you are craving and I will suggest nearby places.',
    },
  ]);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [structuredResponse, setStructuredResponse] = useState<AssistantStructuredResponse | null>(null);
  const chatMutation = useAssistantChatMutation();

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setCoords(DEFAULT_TRAVEL_COORDS);
      },
      GEOLOCATION_OPTIONS,
    );
  }, []);

  const isSendDisabled = useMemo(
    () => chatMutation.isPending || prompt.trim().length === 0,
    [chatMutation.isPending, prompt],
  );

  const closestDistance = useMemo(() => {
    if (!structuredResponse?.items.length) return Number.POSITIVE_INFINITY;
    return Math.min(...structuredResponse.items.map((item) => toDistanceValue(item.distance)));
  }, [structuredResponse]);

  const sendMessage = async () => {
    await sendMessageWithText(prompt);
  };

  const sendMessageWithText = async (rawMessage: string) => {
    const trimmedPrompt = rawMessage.trim();
    if (trimmedPrompt.length === 0 || chatMutation.isPending) return;

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedPrompt,
    };
    setMessages((previous) => [...previous, userMessage]);
    setPrompt('');
    setErrorMessage('');

    try {
      const result = await chatMutation.mutateAsync({
        message: trimmedPrompt,
        lat: coords.lat,
        lng: coords.lng,
        sessionId,
        history: messages.map((item) => ({ role: item.role, text: item.text })),
      });
      setSessionId(result.data.sessionId);

      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: result.data.response.message,
        },
      ]);
      setStructuredResponse(result.data.response);
    } catch (error) {
      const message =
        (error as ApiError).message || (error instanceof Error ? error.message : 'Failed to contact assistant');
      setErrorMessage(message);
    }
  };

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
              {messages.map((message) =>
                message.role === 'assistant' ? (
                  <div
                    key={message.id}
                    className="rounded-xl border border-border/60 bg-background/85 p-3 text-xs text-foreground/85 dark:border-white/10 dark:bg-white/5 dark:text-white/85"
                  >
                    {message.text}
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[82%] rounded-full border border-fuchsia-300/40 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white">
                      {message.text}
                    </div>
                  </div>
                ),
              )}
              {errorMessage ? (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                  {errorMessage}
                </div>
              ) : null}
              {chatMutation.isPending ? (
                <div className="rounded-xl border border-border/60 bg-background/85 p-3 text-xs text-foreground/85 dark:border-white/10 dark:bg-white/5 dark:text-white/85">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                    AI Thinking...
                  </div>
                </div>
              ) : null}
              {structuredResponse ? (
                <div className="rounded-xl border border-border/60 bg-background/85 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-1 inline-flex rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium uppercase text-violet-200">
                    {structuredResponse.type}
                  </div>
                  <p className="text-sm font-semibold">{structuredResponse.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{structuredResponse.message}</p>
                </div>
              ) : null}
              {structuredResponse ? (
                <div className="flex flex-wrap gap-2">
                  {structuredResponse.quickActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        setPrompt(action);
                        void sendMessageWithText(action);
                      }}
                      className="rounded-full border border-border/60 bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              ) : null}
              {structuredResponse?.items.map((item, index) => (
                <article key={`${item.name}-${item.distance}`} className="rounded-xl border border-border/60 bg-background/85 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Action
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">📍 {item.distance} • {item.cost}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {index === 0 ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                        Best choice
                      </span>
                    ) : null}
                    {toDistanceValue(item.distance) === closestDistance ? (
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
                        Closest
                      </span>
                    ) : null}
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {item.mapsUrl ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(item.mapsUrl, '_blank')}
                        className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        {item.action === 'call' ? 'Call / View' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(item.mapsUrl, '_blank')}
                        className="inline-flex items-center justify-center rounded-full border border-border/70 bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                      >
                        Navigate
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
          <footer className="border-t border-border/50 p-3 dark:border-white/10">
            <div className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-border/70 bg-background/90 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask anything..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/80 text-foreground hover:bg-secondary dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"><WandSparkles className="h-3.5 w-3.5" /></button>
              <button
                type="button"
                onClick={() => {
                  void sendMessage();
                }}
                disabled={isSendDisabled}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </footer>
        </div>
      </section>
      <FloatingEmergencyButton onClick={() => setIsEmergencyOpen(true)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
