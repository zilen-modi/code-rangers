import { useQuery } from '@tanstack/react-query';
import { getFoodInfo } from '@/features/food/api/get-food-info';
import { FoodInfoQuery } from '@/features/food/types';

export function useFoodInfoQuery(query: FoodInfoQuery, enabled = true) {
  return useQuery({
    queryKey: ['food-info', query],
    queryFn: () => getFoodInfo(query),
    enabled,
  });
}
