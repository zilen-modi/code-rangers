import { useQuery } from '@tanstack/react-query';
import { getTravelInfo } from '@/features/travel/api/get-travel-info';
import { TravelInfoQuery, TravelPlace } from '@/features/travel/types';

export function useTravelInfoQuery<TData = Record<string, TravelPlace[]>>(
  query: TravelInfoQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: ['travel-info', query],
    queryFn: () => getTravelInfo<TData>(query),
    enabled,
  });
}
