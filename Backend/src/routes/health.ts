import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'Talent Graph Backend',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  });
});
