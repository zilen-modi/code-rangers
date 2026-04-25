import { useQuery } from '@tanstack/react-query';
import { getTodos } from '@/features/todos/api/todos';

export const TODOS_QUERY_KEY = ['todos'] as const;

export function useTodosQuery() {
  return useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: getTodos,
  });
}
