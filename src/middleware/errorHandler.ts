import { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message ?? 'Invalid request.' });
  }
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};

export const notFoundHandler: ErrorRequestHandler | any = (_req: any, res: any) => {
  res.status(404).json({ error: 'Not found.' });
};
