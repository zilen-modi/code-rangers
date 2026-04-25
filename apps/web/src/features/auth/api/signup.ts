import { apiClient } from '@/services/api-client';
import { LoginSchema } from '@/features/auth/schema';
import { LoginResponse } from '@/features/auth/types';
import { apiUrls } from '@/services/api-urls';

export async function signup(payload: LoginSchema) {
  const response = await apiClient.post<LoginResponse & { token: string }>(apiUrls.signup, payload);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
}
