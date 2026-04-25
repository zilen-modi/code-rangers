import { apiClient } from '@/services/api-client';
import { apiUrls } from '@/services/api-urls';
import { TravelInfoQuery, TravelInfoResponse, TravelPlace } from '@/features/travel/types';

export async function getTravelInfo<TData = Record<string, TravelPlace[]>>(query: TravelInfoQuery) {
  const response = await apiClient.get<TravelInfoResponse<TData>>(apiUrls.travelInfo, {
    params: {
      lat: query.lat.toString(),
      lng: query.lng.toString(),
      type: query.type,
    },
  });

  return response.data;
}
