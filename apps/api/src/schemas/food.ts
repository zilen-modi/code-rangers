import { z } from 'zod';

export const foodQuerySchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid latitude'),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid longitude'),
  radius: z
    .string()
    .regex(/^\d+$/, 'Invalid radius')
    .optional(),
  search: z.string().max(80).optional(),
});
