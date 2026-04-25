import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as TodoController from '../controllers/TodoController';

const router = Router();

router.use(authenticate);

router.post('/', TodoController.createTodo);
router.get('/', TodoController.getAllTodos);
router.put('/:id', TodoController.updateTodo);
router.delete('/:id', TodoController.deleteTodo);

export default router;
