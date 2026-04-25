import { z } from 'zod';

export const travelQuerySchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid latitude'),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid longitude'),
  type: z.enum(['sos', 'essentials', 'places']),
});

export type TravelType = z.infer<typeof travelQuerySchema>['type'];

export interface Place {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  name: string;
  type: string;
}

export interface TravelResponse {
  success: boolean;
  data: Record<string, Place[]>;
}
