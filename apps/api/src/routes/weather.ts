import { Router } from 'express';
import * as WeatherController from '../controllers/WeatherController.js';

const router = Router();

router.get('/info', WeatherController.getWeather);

export default router;
