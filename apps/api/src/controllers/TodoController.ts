import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createTodoSchema, updateTodoSchema } from '../schemas/index';
import { TodoService } from '../services/TodoService';

const todoService = new TodoService();

export const createTodo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      return;
    }

    const { title } = parsed.data;
    const todo = await todoService.create(req.user!.userId, title);
    res.status(201).json({ message: 'Todo created', todo });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};

export const getAllTodos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const todos = await todoService.getAllForUser(req.user!.userId);
    res.status(200).json({ todos });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};

export const updateTodo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const todoId = parseInt(req.params.id as string, 10);
    if (isNaN(todoId)) {
      res.status(400).json({ message: 'Invalid Todo ID' });
      return;
    }

    const parsed = updateTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      return;
    }

    const updatedTodo = await todoService.update(todoId, req.user!.userId, parsed.data);
    res.status(200).json({ message: 'Todo updated', todo: updatedTodo });
  } catch (error: any) {
    if (error.message === 'Todo not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};

export const deleteTodo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const todoId = parseInt(req.params.id as string, 10);
    if (isNaN(todoId)) {
      res.status(400).json({ message: 'Invalid Todo ID' });
      return;
    }

    await todoService.delete(todoId, req.user!.userId);
    res.status(200).json({ message: 'Todo deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Todo not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};
