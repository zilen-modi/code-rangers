import { Router } from 'express';
import * as EmergencyController from '../controllers/EmergencyController.js';

const router = Router();

router.post('/sos', EmergencyController.sendSOS);

export default router;
