import { getAIAdapter } from '@repo/ai-adapter';
import type { AIProvider, BaseAIAdapter } from '@repo/ai-adapter';
import * as TravelService from './TravelService';

const PROVIDER = (process.env.TRANSLATION_PROVIDER || 'ollama') as AIProvider;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ASSISTANT_MODEL =
  process.env.ASSISTANT_TEXT_MODEL || (PROVIDER === 'openai' ? 'gpt-4o-mini' : 'llama3');
const DEFAULT_TRAVEL_COORDS = {
  lat: 13.7563,
  lng: 100.5018,
};

type LatLng = { lat: number; lng: number };
type AssistantIntent = 'recommendation' | 'info' | 'emergency' | 'translation';

export type AssistantHistoryMessage = {
  role: 'assistant' | 'user';
  text: string;
};

export type AssistantRecommendation = {
  name: string;
  subtitle: string;
  distance: string;
  price: '$' | '$$';
  rating: number;
  tags: string[];
  mapsUrl: string;
};

export type AssistantActionItem = {
  name: string;
  description: string;
  distance: string;
  cost: string;
  tags: string[];
  action: 'navigate' | 'call' | 'view';
  mapsUrl?: string;
};

export type AssistantStructuredResponse = {
  type: AssistantIntent;
  title: string;
  message: string;
  items: AssistantActionItem[];
  quickActions: string[];
};

export type AssistantChatResult = {
  sessionId: string;
  response: AssistantStructuredResponse;
  recommendations: AssistantRecommendation[];
  history: AssistantHistoryMessage[];
  metadata?: Record<string, unknown>;
};

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(origin: LatLng, target: LatLng): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = toRad(target.lat - origin.lat);
  const dLng = toRad(target.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(target.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function formatDistance(distanceKm: number): string {
  return `${distanceKm.toFixed(1)} km`;
}

function getPriceTier(tags: Record<string, string>): '$' | '$$' {
  const cuisine = (tags.cuisine || '').toLowerCase();
  const tourism = (tags.tourism || '').toLowerCase();
  if (cuisine.includes('fine') || tourism.includes('hotel')) {
    return '$$';
  }
  return '$';
}

function getSubtitle(tags: Record<string, string>, type: string): string {
  if (tags.cuisine) {
    return tags.cuisine
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(', ');
  }
  if (tags.tourism) {
    return tags.tourism.charAt(0).toUpperCase() + tags.tourism.slice(1);
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function normalizeRecommendations(
  placesByType: Record<string, Array<{ name: string; lat: number; lon: number; tags: Record<string, string>; type: string; googleMapsUrl: string }>>,
  origin: LatLng,
): AssistantRecommendation[] {
  const flattened = Object.values(placesByType).flat();
  return flattened
    .filter((place) => place.name && place.name !== 'Unknown')
    .slice(0, 5)
    .map((place, index) => {
      const distanceKm = calculateDistanceKm(origin, { lat: place.lat, lng: place.lon });
      return {
        name: place.name,
        subtitle: getSubtitle(place.tags, place.type),
        distance: formatDistance(distanceKm),
        price: getPriceTier(place.tags),
        rating: Number((4.6 + ((index % 4) * 0.1)).toFixed(1)),
        tags: [
          place.tags.opening_hours ? 'Open hours listed' : 'Popular nearby',
          place.tags.cuisine ? 'Local cuisine' : 'Recommended',
        ],
        mapsUrl: place.googleMapsUrl,
      };
    });
}

function buildAssistantPrompt(userMessage: string, recommendations: AssistantRecommendation[]): string {
  return [
    'You are a concise travel assistant.',
    'Use the user message and nearby recommendations to answer helpfully.',
    'Keep it practical and short (2-4 sentences).',
    'If recommendations exist, mention 1-2 best options and why.',
    'Do not output JSON.',
    '',
    `User message: ${userMessage}`,
    `Nearby recommendations JSON: ${JSON.stringify(recommendations)}`,
    '',
    'Assistant reply:',
  ].join('\n');
}

export class AssistantService {
  private textAdapter: BaseAIAdapter;
  private sessionHistory = new Map<string, AssistantHistoryMessage[]>();

  constructor() {
    const adapterConfig = {
      apiKey: OPENAI_API_KEY || undefined,
    };
    this.textAdapter = getAIAdapter(PROVIDER, {
      ...adapterConfig,
      defaultModel: ASSISTANT_MODEL,
      timeoutMs: 45_000,
      retries: { maxAttempts: 2, backoffMs: 500 },
    });
  }

  private getIntent(message: string): AssistantIntent {
    const value = message.toLowerCase();
    if (
      value.includes('emergency') ||
      value.includes('help now') ||
      value.includes('accident') ||
      value.includes('unsafe') ||
      value.includes('danger')
    ) {
      return 'emergency';
    }
    if (
      value.includes('translate') ||
      value.includes('meaning') ||
      value.includes('say this') ||
      value.includes('in hindi') ||
      value.includes('in english')
    ) {
      return 'translation';
    }
    if (
      value.includes('atm') ||
      value.includes('charging') ||
      value.includes('petrol') ||
      value.includes('toilet') ||
      value.includes('restroom')
    ) {
      return 'info';
    }
    return 'recommendation';
  }

  private toActionItems(recommendations: AssistantRecommendation[]): AssistantActionItem[] {
    return recommendations.slice(0, 5).map((item) => ({
      name: item.name,
      description: item.subtitle,
      distance: item.distance,
      cost: item.price,
      tags: item.tags,
      action: 'navigate',
      mapsUrl: item.mapsUrl,
    }));
  }

  private toEmergencyItems(
    categories: Array<{ categoryLabel: string; list: Array<{ name: string; lat: number; lon: number; googleMapsUrl: string }> }>,
    origin: LatLng,
  ): AssistantActionItem[] {
    return categories
      .flatMap((category) =>
        category.list.map((place) => ({
          name: place.name || category.categoryLabel,
          description: category.categoryLabel,
          distance: formatDistance(calculateDistanceKm(origin, { lat: place.lat, lng: place.lon })),
          cost: 'Emergency support',
          tags: ['Safety first', 'Open nearby'],
          action: 'call' as const,
          mapsUrl: place.googleMapsUrl,
        })),
      )
      .slice(0, 5);
  }

  private buildResponse(
    intent: AssistantIntent,
    message: string,
    items: AssistantActionItem[],
  ): AssistantStructuredResponse {
    if (intent === 'emergency') {
      return {
        type: 'emergency',
        title: 'Emergency Support Nearby',
        message:
          'Stay calm. First move to a safe public spot, then contact emergency services (112) and head to the nearest listed help point.',
        items,
        quickActions: ['Call now', 'Show on map', 'Translate'],
      };
    }

    if (intent === 'translation') {
      return {
        type: 'translation',
        title: 'Translation Help',
        message:
          'Share the exact sentence and target language (for example: "Translate to Thai"), and I will return original, translated, polite, and pronunciation versions.',
        items: [],
        quickActions: ['Translate menu', 'Show on map', 'Call now'],
      };
    }

    if (intent === 'info') {
      return {
        type: 'info',
        title: 'Nearby Essentials',
        message:
          items.length > 0
            ? `Best immediate option: ${items[0].name}. It is close and practical right now.`
            : 'I could not find nearby essentials right now. Try a slightly broader area.',
        items,
        quickActions: ['Show on map', 'Call now', 'Find nearby'],
      };
    }

    return {
      type: 'recommendation',
      title: 'Best Food Nearby',
      message:
        items.length > 0
          ? `Top pick: ${items[0].name}. Here are practical options with distance, cost, and one-tap actions.`
          : 'I could not find nearby food picks right now. Tell me your budget or cuisine and I will refine.',
      items,
      quickActions: ['Show on map', 'Translate menu', 'Call now'],
    };
  }

  async chat(input: {
    message: string;
    lat?: number;
    lng?: number;
    sessionId?: string;
    history?: AssistantHistoryMessage[];
  }): Promise<AssistantChatResult> {
    const sessionId = input.sessionId || `session-${Date.now()}`;
    const origin: LatLng = {
      lat: input.lat ?? DEFAULT_TRAVEL_COORDS.lat,
      lng: input.lng ?? DEFAULT_TRAVEL_COORDS.lng,
    };
    const intent = this.getIntent(input.message);
    const previous = this.sessionHistory.get(sessionId) ?? [];
    const incomingHistory = input.history ?? [];
    const mergedHistory = [...previous, ...incomingHistory].slice(-20);

    let recommendations: AssistantRecommendation[] = [];
    let actionItems: AssistantActionItem[] = [];
    if (intent === 'recommendation') {
      const nearbyPlaces = await TravelService.getPlacesNearby(origin, 5000);
      recommendations = normalizeRecommendations(nearbyPlaces, origin);
      actionItems = this.toActionItems(recommendations);
    } else if (intent === 'info') {
      const essentials = await TravelService.getEssentialsNearby(origin, 4000);
      const recommendationLike = normalizeRecommendations(essentials, origin);
      recommendations = recommendationLike;
      actionItems = this.toActionItems(recommendationLike);
    } else if (intent === 'emergency') {
      const sos = await TravelService.getSosNearby(origin, 5000);
      actionItems = this.toEmergencyItems(sos, origin);
      recommendations = actionItems.map((item, index) => ({
        name: item.name,
        subtitle: item.description,
        distance: item.distance,
        price: '$',
        rating: Number((4.9 - index * 0.1).toFixed(1)),
        tags: item.tags,
        mapsUrl: item.mapsUrl || '',
      }));
    }

    let structured = this.buildResponse(intent, input.message, actionItems);
    const fallbackReply = structured.message;

    try {
      const result = await this.textAdapter.generateText({
        prompt: [
          ...mergedHistory.map((item) => `${item.role.toUpperCase()}: ${item.text}`),
          buildAssistantPrompt(input.message, recommendations),
          'Reply in a friendly, calm travel-guide tone and focus on next actions.',
        ].join('\n'),
        model: ASSISTANT_MODEL,
        temperature: 0.4,
        maxTokens: 220,
      });
      structured = {
        ...structured,
        message: result.text.trim() || structured.message,
      };
      const newHistory = [
        ...mergedHistory,
        { role: 'user' as const, text: input.message },
        { role: 'assistant' as const, text: structured.message },
      ].slice(-20);
      this.sessionHistory.set(sessionId, newHistory);
      return {
        sessionId,
        response: structured,
        recommendations,
        history: newHistory,
        metadata: result.metadata,
      };
    } catch (error) {
      const newHistory = [
        ...mergedHistory,
        { role: 'user' as const, text: input.message },
        { role: 'assistant' as const, text: fallbackReply },
      ].slice(-20);
      this.sessionHistory.set(sessionId, newHistory);
      return {
        sessionId,
        response: structured,
        recommendations,
        history: newHistory,
        metadata: { fallback: true, reason: error instanceof Error ? error.message : 'unknown_error' },
      };
    }
  }
}
