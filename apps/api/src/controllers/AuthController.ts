import { Request, Response } from 'express';
import { signupSchema, loginSchema } from '../schemas/index';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedParams = signupSchema.safeParse(req.body);
    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsedParams.error.errors });
      return;
    }

    const { email, password, role } = parsedParams.data;
    const result = await authService.signup(email, password, role);
    res.status(201).json({ message: 'User created successfully', ...result });
  } catch (error: any) {
    if (error.message === 'Email already in use') {
      res.status(409).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedParams = loginSchema.safeParse(req.body);
    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsedParams.error.errors });
      return;
    }

    const { email, password } = parsedParams.data;
    const result = await authService.login(email, password);
    res.status(200).json({ message: 'Login successful', ...result });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};
