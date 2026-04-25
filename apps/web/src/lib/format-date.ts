import { format } from 'date-fns';

export function formatDate(value: Date | string, pattern = 'PPP') {
  return format(new Date(value), pattern);
}
