import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import playerRoutes from './routes/players';
import formationRoutes from './routes/formations';
import matchEventRoutes from './routes/matchEvents';
import statsRoutes from './routes/stats';
import { errorHandler, notFoundHandler } from './middleware/error';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/teams/:teamId/players', playerRoutes);
app.use('/api/teams/:teamId/formations', formationRoutes);
app.use('/api/teams/:teamId/formations/:formationId/events', matchEventRoutes);
app.use('/api/teams/:teamId/stats', statsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
