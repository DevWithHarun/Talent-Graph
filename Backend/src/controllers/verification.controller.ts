import type { Request, Response, NextFunction } from 'express';
import { VerificationService } from '../services/verification.service.js';

export class VerificationController {
  constructor(private readonly verificationService = new VerificationService()) {}

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(this.verificationService.list());
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = this.verificationService.create(req.body);
      return res.status(201).json({ message: 'Verification request created', item: created });
    } catch (error) {
      return next(error);
    }
  };
}
