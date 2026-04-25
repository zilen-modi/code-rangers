import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';
import travelRoutes from './routes/travel';
import translateRoutes from './routes/translate';
import emergencyRoutes from './routes/emergency';
import weatherRoutes from './routes/weather';
import menuRoutes from './routes/menu';
import placeRoutes from './routes/places';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/todos', todoRoutes);
app.use('/travel', travelRoutes);
app.use('/translate', translateRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/weather', weatherRoutes);
app.use('/menu', menuRoutes);
app.use('/places', placeRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected error occurred!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
