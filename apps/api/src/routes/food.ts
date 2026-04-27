import { Router } from 'express';
import * as FoodController from '../controllers/FoodController';

const router = Router();

router.get('/info', FoodController.getFoodInfo);

export default router;
