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

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const athleteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = this.athleteService.update(athleteId, req.body);
      return res.json({
        message: 'Athlete profile updated successfully',
        item: updated,
      });
    } catch (error) {
      return next(error);
    }
  };

  publishProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const athleteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const isPublished = req.body?.isPublished !== false;
      const published = this.athleteService.publish(athleteId, isPublished);
      return res.json({
        message: isPublished ? 'Athlete profile published successfully' : 'Athlete profile saved as draft',
        item: published,
      });
    } catch (error) {
      return next(error);
    }
  };

  // ── CAREER CONTROLLERS ──
  getCareer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const athleteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const career = this.athleteService.getCareer(athleteId);
      return res.json({
        message: 'Career profile retrieved',
        item: career,
      });
    } catch (error) {
      return next(error);
    }
  };

  updateCareer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const athleteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = this.athleteService.updateCareer(athleteId, req.body);
      return res.json({
        message: 'Career profile updated successfully',
        item: updated,
      });
    } catch (error) {
      return next(error);
    }
  };

  addTimelineEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const athleteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const newEntry = this.athleteService.addTimelineEntry(athleteId, req.body);
      return res.status(201).json({
        message: 'Career timeline entry recorded successfully',
        item: newEntry,
      });
    } catch (error) {
      return next(error);
    }
  };

  addTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const athleteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const newTransfer = this.athleteService.addTransfer(athleteId, req.body);
      return res.status(201).json({
        message: 'Transfer movement recorded successfully',
        item: newTransfer,
      });
    } catch (error) {
      return next(error);
    }
  };

  addAchievement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const athleteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const newAchievement = this.athleteService.addAchievement(athleteId, req.body);
      return res.status(201).json({
        message: 'Career achievement recorded successfully',
        item: newAchievement,
      });
    } catch (error) {
      return next(error);
    }
  };
}
