import { ApiError } from '@/services/api-client';

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as ApiError).message);
  }

  return 'Something unexpected happened. Please try again.';
}
