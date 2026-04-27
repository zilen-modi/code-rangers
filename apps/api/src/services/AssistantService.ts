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

export type AssistantRecommendation = {
  name: string;
  subtitle: string;
  distance: string;
  price: '$' | '$$';
  rating: number;
  tags: string[];
  mapsUrl: string;
};

export type AssistantChatResult = {
  reply: string;
  recommendations: AssistantRecommendation[];
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

  async chat(input: { message: string; lat?: number; lng?: number }): Promise<AssistantChatResult> {
    const origin: LatLng = {
      lat: input.lat ?? DEFAULT_TRAVEL_COORDS.lat,
      lng: input.lng ?? DEFAULT_TRAVEL_COORDS.lng,
    };

    const nearbyPlaces = await TravelService.getPlacesNearby(origin, 5000);
    const recommendations = normalizeRecommendations(nearbyPlaces, origin);

    const fallbackReply =
      recommendations.length > 0
        ? `Found ${recommendations.length} nearby options. Start with ${recommendations[0].name} for a reliable local pick.`
        : 'I could not find nearby spots right now, but I can still help with trip planning questions.';

    try {
      const result = await this.textAdapter.generateText({
        prompt: buildAssistantPrompt(input.message, recommendations),
        model: ASSISTANT_MODEL,
        temperature: 0.4,
        maxTokens: 300,
      });
      return {
        reply: result.text.trim() || fallbackReply,
        recommendations,
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        reply: fallbackReply,
        recommendations,
        metadata: { fallback: true, reason: error instanceof Error ? error.message : 'unknown_error' },
      };
    }
  }
}
