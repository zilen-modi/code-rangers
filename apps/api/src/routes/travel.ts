import { Router } from 'express';
import * as TravelController from '../controllers/TravelController';

const router = Router();

router.get('/info', TravelController.getTravelInfo);

export default router;
