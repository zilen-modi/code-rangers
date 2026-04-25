import { Request, Response } from 'express';
import * as TravelService from '../services/TravelService.js';
import { travelQuerySchema, TravelResponse } from '../schemas/travel.js';

export const getTravelInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = travelQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { lat, lng, type } = validation.data;
    const coordinates = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    let data;

    switch (type) {
      case 'sos':
        data = await TravelService.getSosNearby(coordinates);
        break;
      case 'essentials':
        data = await TravelService.getEssentialsNearby(coordinates, 10000);
        break;
      case 'places':
        data = await TravelService.getPlacesNearby(coordinates);
        break;
      default:
        res.status(400).json({ error: 'Invalid type.' });
        return;
    }

    const response: TravelResponse = {
      success: true,
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getTravelInfo controller:', error);
    res.status(500).json({ error: 'Internal server error while fetching travel info.' });
  }
};
