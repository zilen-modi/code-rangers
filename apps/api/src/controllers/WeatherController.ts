import { Request, Response } from 'express';
import * as WeatherService from '../services/WeatherService.js';

export const getWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude (lat) and Longitude (lng) are required.' });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({ error: 'Invalid coordinates provided.' });
      return;
    }

    const weather = await WeatherService.getWeatherNearby(latitude, longitude);

    res.json({
      success: true,
      data: weather
    });
  } catch (error) {
    console.error('Error in WeatherController:', error);
    res.status(500).json({ error: 'Internal server error while fetching weather info.' });
  }
};
