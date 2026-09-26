// Wraps a Zod schema as Express middleware. On success, the parsed
// (trimmed, coerced, defaulted) value replaces the raw input — so
// controllers only ever see already-valid data and never re-validate.
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
  // Express 5 makes req.query a getter-only property, so the parsed
  // (coerced/defaulted) query goes on res.locals instead of trying to
  // reassign req.query directly.
  (req as any).validatedQuery = result.data;
  next();
};
