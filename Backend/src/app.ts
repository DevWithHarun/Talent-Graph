import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { athletesRouter } from './routes/athletes.js';
import { clubsRouter } from './routes/clubs.js';
import { playersRouter } from './routes/players.js';
import { verificationRouter } from './routes/verification.js';

export const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/', (_req, res) => {
  res.json({
    name: 'Talent Graph Backend',
    status: 'running',
    apiPrefix: env.API_PREFIX,
  });
});

app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/health`, healthRouter);
app.use(`${env.API_PREFIX}/athletes`, athletesRouter);
app.use(`${env.API_PREFIX}/players`, playersRouter);
app.use(`${env.API_PREFIX}/clubs`, clubsRouter);
app.use(`${env.API_PREFIX}/verification`, verificationRouter);

app.use(notFoundHandler);
app.use(errorHandler);
