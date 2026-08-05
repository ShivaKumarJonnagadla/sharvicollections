import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/http.js';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/tokens.js';

export interface AuthedRequest extends Request {
  user?: AccessTokenPayload;
}

export const ACCESS_COOKIE = 'sc_access';
export const REFRESH_COOKIE = 'sc_refresh';
export const CSRF_COOKIE = 'sc_csrf';

/** Require a valid access token (from HttpOnly cookie or Bearer header). */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = req.cookies?.[ACCESS_COOKIE] ?? bearer;
  if (!token) return next(AppError.unauthorized());
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(AppError.unauthorized('Session expired or invalid'));
  }
}

/** Require the authenticated user to have one of the given roles. */
export function requireRole(...roles: Array<'ADMIN' | 'CUSTOMER'>) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
}
