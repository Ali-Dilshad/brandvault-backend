import { RequestHandler } from 'express';
import { ZodType } from 'zod';
import { BadRequest } from '../lib/errors';

export const validateBody = (schema: ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(BadRequest(result.error.issues[0]?.message ?? 'Invalid request body.'));
  }
  req.body = result.data;
  next();
};

export const validateQuery = (schema: ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return next(BadRequest(result.error.issues[0]?.message ?? 'Invalid query parameters.'));
  }
  (req as any).validatedQuery = result.data;
  next();
};
