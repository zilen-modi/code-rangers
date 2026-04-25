import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as TodoController from '../controllers/TodoController.js';

const router = Router();

router.use(authenticate);

router.post('/', TodoController.createTodo);
router.get('/', TodoController.getAllTodos);
router.put('/:id', TodoController.updateTodo);
router.delete('/:id', TodoController.deleteTodo);

export default router;
