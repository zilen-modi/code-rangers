import { useMutation } from '@tanstack/react-query';
import { chatWithAssistant } from '@/features/assistant/api/chat';

export function useAssistantChatMutation() {
  return useMutation({ mutationFn: chatWithAssistant });
}
