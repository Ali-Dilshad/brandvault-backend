export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}
export const BadRequest = (message: string) => new AppError(400, message);
export const Unauthorized = (message = 'Authentication required.') => new AppError(401, message);
export const Forbidden = (message = "You don't have access to that.") => new AppError(403, message);
export const NotFound = (message = 'Not found.') => new AppError(404, message);
export const Conflict = (message: string) => new AppError(409, message);
