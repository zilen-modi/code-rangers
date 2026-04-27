import { Router } from 'express';
import * as AssistantController from '../controllers/AssistantController';

const router = Router();

router.post('/chat', AssistantController.chat);

export default router;
