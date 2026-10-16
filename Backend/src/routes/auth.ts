import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { LoginInputSchema } from '../services/auth.service.js';

export const authRouter = Router();
const authController = new AuthController();

authRouter.post('/login', validateBody(LoginInputSchema), authController.login);
