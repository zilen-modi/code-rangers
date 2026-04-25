// API Endpoints Registry

export const apiUrls = {
  signup: '/auth/signup',
  login: '/auth/login',
  todos: '/todos',
  travelInfo: '/travel/info',
} as const;

export type ApiUrlKeys = keyof typeof apiUrls;
