// API Endpoints Registry

export const apiUrls = {
  signup: '/auth/signup',
  login: '/auth/login',
  todos: '/todos',
  travelInfo: '/travel/info',
  weatherInfo: '/weather/info',
} as const;

export type ApiUrlKeys = keyof typeof apiUrls;
