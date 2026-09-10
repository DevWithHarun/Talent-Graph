import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { CreateVerificationRequestSchema } from '../services/verification.service.js';

export const verificationRouter = Router();
const verificationController = new VerificationController();

verificationRouter.get('/requests', verificationController.list);
verificationRouter.post('/requests', validateBody(CreateVerificationRequestSchema), verificationController.create);
