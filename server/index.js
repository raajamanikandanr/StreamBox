import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import { seedDatabase } from './seed.js';

import moviesRouter from './routes/movies.js';
import authRouter from './routes/auth.js';
import plansRouter from './routes/plans.js';
import progressRouter from './routes/progress.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logger for real-time visibility
app.use((req, res, next) => {
  console.log(`[API ${req.method}] ${req.url}`);
  next();
});

// Routes
app.use('/api/movies', moviesRouter);
app.use('/api/admin/movies', moviesRouter);
app.use('/api/auth', authRouter);
app.use('/api/plans', plansRouter);
app.use('/api/subscriptions', plansRouter);
app.use('/api/progress', progressRouter);

// Health check & DB status
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Start server and initialize database
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[StreamBox Server] Backend running at http://0.0.0.0:${PORT} (Local & Network)`);
  console.log('[StreamBox Server] Connecting to PostgreSQL database...');
  await seedDatabase();
});
