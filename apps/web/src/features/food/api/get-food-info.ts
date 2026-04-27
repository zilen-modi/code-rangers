import { apiClient } from '@/services/api-client';
import { apiUrls } from '@/services/api-urls';
import { FoodInfoQuery, FoodInfoResponse } from '@/features/food/types';

export async function getFoodInfo(query: FoodInfoQuery) {
  const response = await apiClient.get<FoodInfoResponse>(apiUrls.foodInfo, {
    params: {
      lat: query.lat.toString(),
      lng: query.lng.toString(),
      ...(query.radius ? { radius: query.radius.toString() } : {}),
      ...(query.search ? { search: query.search } : {}),
    },
  });
  return response.data;
}
