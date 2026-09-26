// Runs on every route except /auth/signup and /auth/signin. Reads the
// Bearer token, verifies it, and attaches { id, email } to req.user.
// Every other module trusts req.user without re-checking it — this is
// the one place that decides whether a request is authenticated at all.
import { RequestHandler } from 'express';
import { verifyToken } from '../lib/jwt';
import { Unauthorized } from '../lib/errors';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization') ?? req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(Unauthorized('Missing bearer token.'));

  const payload = verifyToken(token);
  if (!payload) return next(Unauthorized('Invalid or expired session — please sign in again.'));

  req.user = { id: payload.sub, email: payload.email };
  next();
};
