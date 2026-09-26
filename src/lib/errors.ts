// One error class for every "expected" failure (bad input, no session,
// not yours, not found). Anything else that throws is a genuine bug and
// becomes a 500 — see middleware/errorHandler.ts.
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const BadRequest = (message: string) => new AppError(400, message);
export const Unauthorized = (message = 'Authentication required.') => new AppError(401, message);
export const Forbidden = (message = "You don't have access to that.") => new AppError(403, message);
// Used for "not owned by you" as well as "doesn't exist" — see the
// Authorization section in README.md for why those two cases share a
// status code instead of leaking which one it actually is.
export const NotFound = (message = 'Not found.') => new AppError(404, message);
export const Conflict = (message: string) => new AppError(409, message);
