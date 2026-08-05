import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../lib/http.js';
import { CSRF_COOKIE } from './auth.js';

/**
 * Stateless CSRF protection using the double-submit-cookie pattern.
 * A non-HttpOnly `sc_csrf` cookie is set; the SPA reads it and echoes it back
 * in the `x-csrf-token` header on mutating requests. An attacker's cross-site
 * request cannot read the cookie, so it cannot forge a matching header.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function issueCsrfToken(res: Response): string {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: env.isProd,
    sameSite: 'strict',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24,
  });
  return token;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    // Ensure a token exists for the client to use on later mutations.
    if (!req.cookies?.[CSRF_COOKIE]) issueCsrfToken(res);
    return next();
  }
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError(403, 'CSRF_FAILED', 'Invalid or missing CSRF token'));
  }
  next();
}
