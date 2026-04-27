export type AssistantRecommendation = {
  name: string;
  subtitle: string;
  distance: string;
  price: '$' | '$$';
  rating: number;
  tags: string[];
  mapsUrl: string;
};

export type AssistantChatResponse = {
  message: string;
  data: {
    reply: string;
    recommendations: AssistantRecommendation[];
    metadata?: Record<string, unknown>;
  };
};

export type AssistantChatPayload = {
  message: string;
  lat?: number;
  lng?: number;
};
