import { Router } from 'express';
import { AthleteController } from '../controllers/athlete.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { CreateAthleteInputSchema } from '../services/athlete.service.js';

export const athletesRouter = Router();
const athleteController = new AthleteController();

athletesRouter.get('/', athleteController.list);
athletesRouter.get('/:id', athleteController.getById);
athletesRouter.post('/', validateBody(CreateAthleteInputSchema), athleteController.create);
