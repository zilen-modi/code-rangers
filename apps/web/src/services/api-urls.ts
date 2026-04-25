// API Endpoints Registry

export const apiUrls = {
  signup: '/auth/signup',
  login: '/auth/login',
} as const;

export type ApiUrlKeys = keyof typeof apiUrls;
