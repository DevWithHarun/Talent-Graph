import { Router } from 'express';
import { z } from 'zod';

const clubSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  country: z.string().min(2).optional(),
  status: z.enum(['active', 'pending']).default('active'),
});

type Club = z.infer<typeof clubSchema>;

const clubs: Club[] = [
  { id: 'club_001', name: 'Nairobi City FC', country: 'Kenya', status: 'active' },
  { id: 'club_002', name: 'Kisumu Stars', country: 'Kenya', status: 'pending' },
];

export const clubsRouter = Router();

clubsRouter.get('/', (_req, res) => {
  res.json({ items: clubs, total: clubs.length });
});

clubsRouter.post('/', (req, res) => {
  const parsed = clubSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid club payload',
      issues: parsed.error.issues,
    });
  }

  clubs.push(parsed.data);

  return res.status(201).json({
    message: 'Club created',
    item: parsed.data,
  });
});
