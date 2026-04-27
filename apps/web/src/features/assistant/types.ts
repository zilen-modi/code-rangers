export type AssistantRecommendation = {
  name: string;
  subtitle: string;
  distance: string;
  price: '$' | '$$';
  rating: number;
  tags: string[];
  mapsUrl: string;
};

export type AssistantHistoryMessage = {
  role: 'assistant' | 'user';
  text: string;
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
  type: 'recommendation' | 'info' | 'emergency' | 'translation';
  title: string;
  message: string;
  items: AssistantActionItem[];
  quickActions: string[];
};

export type AssistantChatResponse = {
  message: string;
  data: {
    sessionId: string;
    response: AssistantStructuredResponse;
    recommendations: AssistantRecommendation[];
    history: AssistantHistoryMessage[];
    metadata?: Record<string, unknown>;
  };
};

export type AssistantChatPayload = {
  message: string;
  lat?: number;
  lng?: number;
  sessionId?: string;
  history?: AssistantHistoryMessage[];
};
