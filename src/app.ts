import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.controller';
import { brandRouter } from './modules/brand/brand.controller';
import { foldersRouter } from './modules/folders/folders.controller';
import { assetsRouter } from './modules/assets/assets.controller';

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);

app.use('/brand', requireAuth, brandRouter);
app.use('/folders', requireAuth, foldersRouter);
app.use('/assets', requireAuth, assetsRouter);

app.use(notFoundHandler);
app.use(errorHandler);