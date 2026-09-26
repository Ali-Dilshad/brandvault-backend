import { Router } from 'express';
import { validateBody } from '../../middleware/validate';
import { credentialsSchema } from './auth.schema';
import * as authService from './auth.service';

export const authRouter = Router();

authRouter.post('/signup', validateBody(credentialsSchema), async (req, res) => {
  const result = await authService.signUp(req.body);
  res.status(201).json(result);
});

authRouter.post('/signin', validateBody(credentialsSchema), async (req, res) => {
  const result = await authService.signIn(req.body);
  res.status(200).json(result);
});
