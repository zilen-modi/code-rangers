import { TravelInfoResponse, TravelPlace } from '@/features/travel/types';

export type FoodInfoResponse = TravelInfoResponse<Record<string, TravelPlace[]>>;

export type FoodInfoQuery = {
  lat: number;
  lng: number;
  radius?: number;
  search?: string;
};
