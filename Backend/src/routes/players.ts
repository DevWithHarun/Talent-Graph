import { Router } from 'express';
import { z } from 'zod';

const playerSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(2),
  position: z.string().min(2),
  clubId: z.string().optional(),
  status: z.enum(['draft', 'active', 'verified']).default('draft'),
});

type Player = z.infer<typeof playerSchema>;

const players: Player[] = [
  { id: 'player_001', fullName: 'Kevin Mbugua', position: 'Forward', clubId: 'club_001', status: 'verified' },
  { id: 'player_002', fullName: 'Daniel Oduor', position: 'Midfielder', clubId: 'club_001', status: 'active' },
];

export const playersRouter = Router();

playersRouter.get('/', (_req, res) => {
  res.json({ items: players, total: players.length });
});

playersRouter.get('/:id', (req, res) => {
  const player = players.find((item) => item.id === req.params.id);

  if (!player) {
    return res.status(404).json({ message: 'Player not found' });
  }

  return res.json({ item: player });
});

playersRouter.post('/', (req, res) => {
  const parsed = playerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid player payload',
      issues: parsed.error.issues,
    });
  }

  players.push(parsed.data);

  return res.status(201).json({
    message: 'Player created',
    item: parsed.data,
  });
});
