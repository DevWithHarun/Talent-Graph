import express from 'express';
import { app } from './app.js';
import { env } from './config/env.js';

if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`Talent Graph Backend running on http://localhost:${env.PORT}`);
  });
}

export { app };
export default app;

