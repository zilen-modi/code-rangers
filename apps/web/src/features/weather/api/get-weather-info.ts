import { apiClient } from '@/services/api-client';
import { apiUrls } from '@/services/api-urls';
import { WeatherInfoQuery, WeatherInfoResponse } from '@/features/weather/types';

export async function getWeatherInfo(query: WeatherInfoQuery) {
  const response = await apiClient.get<WeatherInfoResponse>(apiUrls.weatherInfo, {
    params: {
      lat: query.lat.toString(),
      lng: query.lng.toString(),
    },
  });

  return response.data;
}
