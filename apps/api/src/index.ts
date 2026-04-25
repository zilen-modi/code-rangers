import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import todoRoutes from './routes/todos.js';
import travelRoutes from './routes/travel.js';
import translateRoutes from './routes/translate.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/todos', todoRoutes);
app.use('/travel', travelRoutes);
app.use('/translate', translateRoutes);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected error occurred!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
