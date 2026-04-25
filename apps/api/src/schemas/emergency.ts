import { z } from 'zod';

export const emergencySchema = z.object({
  userId: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

export type EmergencyRequest = z.infer<typeof emergencySchema>;
