import { Request, Response } from 'express';
import { foodQuerySchema } from '../schemas/food';
import * as FoodService from '../services/FoodService';
import { TravelResponse } from '../schemas/travel';

export const getFoodInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = foodQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { lat, lng, radius, search } = validation.data;
    const coordinates = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    const data = await FoodService.getFoodNearby(
      coordinates,
      radius ? parseInt(radius, 10) : 3500,
      search,
    );

    const response: TravelResponse<typeof data> = {
      success: true,
      data,
    };
    res.json(response);
  } catch (error) {
    console.error('Error in getFoodInfo controller:', error);
    res.status(500).json({ error: 'Internal server error while fetching food info.' });
  }
};
