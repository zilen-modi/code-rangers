import { apiClient } from '@/services/api-client';
import { AssistantChatPayload, AssistantChatResponse } from '@/features/assistant/types';

export async function chatWithAssistant(payload: AssistantChatPayload) {
  const response = await apiClient.post<AssistantChatResponse>('/assistant/chat', payload);
  return response.data;
}
