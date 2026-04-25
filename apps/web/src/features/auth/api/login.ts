import { apiClient } from '@/services/api-client';
import { LoginSchema } from '@/features/auth/schema';
import { LoginResponse } from '@/features/auth/types';

export async function login(payload: LoginSchema) {
  const response = await apiClient.post<LoginResponse & { token: string }>('/auth/login', payload);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
}
