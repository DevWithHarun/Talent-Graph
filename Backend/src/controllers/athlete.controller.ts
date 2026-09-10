import type { Request, Response, NextFunction } from 'express';
import { AthleteService } from '../services/athlete.service.js';

export class AthleteController {
  constructor(private readonly athleteService = new AthleteService()) {}

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(this.athleteService.list());
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const athleteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const athlete = this.athleteService.getById(athleteId);

      if (!athlete) {
        return res.status(404).json({ message: 'Athlete not found' });
      }

      return res.json({ item: athlete });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = this.athleteService.create(req.body);
      return res.status(201).json({ message: 'Athlete created', item: created });
    } catch (error) {
      return next(error);
    }
  };
}
