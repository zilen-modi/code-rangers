import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
};

const onRequest = (config: InternalAxiosRequestConfig) => {
  config.headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
};

const onResponseError = (error: AxiosError) => {
  const apiError: ApiError = {
    message:
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      'Request failed',
    status: error.response?.status,
    code: error.code,
  };

  return Promise.reject(apiError);
};

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 10_000,
});

apiClient.interceptors.request.use(onRequest);
apiClient.interceptors.response.use((response) => response, onResponseError);
