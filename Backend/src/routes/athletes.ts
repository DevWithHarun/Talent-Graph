import { Router } from 'express';
import { AthleteController } from '../controllers/athlete.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { CreateAthleteInputSchema, UpdateAthleteProfileSchema } from '../services/athlete.service.js';

export const athletesRouter = Router();
const athleteController = new AthleteController();

athletesRouter.get('/', athleteController.list);
athletesRouter.get('/:id', athleteController.getById);
athletesRouter.post('/', validateBody(CreateAthleteInputSchema), athleteController.create);
athletesRouter.patch('/:id', validateBody(UpdateAthleteProfileSchema), athleteController.updateProfile);
athletesRouter.put('/:id', validateBody(UpdateAthleteProfileSchema), athleteController.updateProfile);
athletesRouter.post('/:id/publish', athleteController.publishProfile);
athletesRouter.patch('/:id/publish', athleteController.publishProfile);

// Career Platform endpoints
athletesRouter.get('/:id/career', athleteController.getCareer);
athletesRouter.put('/:id/career', athleteController.updateCareer);
athletesRouter.post('/:id/career', athleteController.updateCareer);
athletesRouter.post('/:id/career/timeline', athleteController.addTimelineEntry);
athletesRouter.post('/:id/career/transfers', athleteController.addTransfer);
athletesRouter.post('/:id/career/achievements', athleteController.addAchievement);
