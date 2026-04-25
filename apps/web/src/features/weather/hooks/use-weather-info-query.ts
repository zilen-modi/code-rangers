import { useQuery } from '@tanstack/react-query';
import { getWeatherInfo } from '@/features/weather/api/get-weather-info';
import { WeatherInfoQuery } from '@/features/weather/types';

export function useWeatherInfoQuery(query: WeatherInfoQuery, enabled = true) {
  return useQuery({
    queryKey: ['weather-info', query],
    queryFn: () => getWeatherInfo(query),
    enabled,
  });
}
