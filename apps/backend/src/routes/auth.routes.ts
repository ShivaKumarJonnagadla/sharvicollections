import { Router, type Response } from 'express';
import { verify as argonVerify } from '@node-rs/argon2';
import { loginSchema } from '@sharvi/shared';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler, ok } from '../lib/http.js';
import { audit } from '../lib/audit.js';
import {
  durationToMs,
  hashToken,
  randomId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/tokens.js';
import { validate, validated } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { issueCsrfToken } from '../middleware/csrf.js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  requireAuth,
  type AuthedRequest,
} from '../middleware/auth.js';
import type { LoginInput } from '@sharvi/shared';

const router = Router();

function cookieBase() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'strict' as const,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...cookieBase(),
    maxAge: durationToMs(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieBase(),
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, cookieBase());
  res.clearCookie(REFRESH_COOKIE, cookieBase());
}

/** Persist a refresh token (hashed) and return the signed JWT. */
async function issueRefreshToken(userId: string, req: AuthedRequest): Promise<string> {
  const jti = randomId(16);
  const token = signRefreshToken({ sub: userId, jti });
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      userAgent: req.get('user-agent') ?? undefined,
      ip: req.ip,
      expiresAt: new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN)),
    },
  });
  return token;
}

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Admin login (sets HttpOnly access & refresh cookies)
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { email, password } = validated<LoginInput>(req);
    // Accept either an email or the "admin" username (resolves to the admin account).
    const identifier = email.trim().toLowerCase();
    const user = identifier.includes('@')
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : identifier === 'admin'
        ? await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
        : await prisma.user.findUnique({ where: { email: identifier } });

    // Constant-ish behaviour: always verify against a hash to reduce timing leaks.
    const valid = user
      ? await argonVerify(user.passwordHash, password).catch(() => false)
      : await argonVerify(
          '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$0000000000000000000000000000000000000000000',
          password,
        ).catch(() => false);

    if (!user || !valid || !user.isActive) {
      await audit(req, { action: 'auth.login.failed', metadata: { email } });
      throw AppError.unauthorized('Invalid email or password');
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = await issueRefreshToken(user.id, req);
    setAuthCookies(res, accessToken, refreshToken);
    issueCsrfToken(res);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await audit(req, { action: 'auth.login', userId: user.id });

    return ok(res, {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }),
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and issue a new access token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: AuthedRequest, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw AppError.unauthorized('No refresh token');

    let payload: { sub: string; jti: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      clearAuthCookies(res);
      throw AppError.unauthorized('Invalid refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      clearAuthCookies(res);
      throw AppError.unauthorized('Refresh token expired');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      throw AppError.unauthorized();
    }

    // Rotate: revoke the old token, issue a new pair.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const newRefresh = await issueRefreshToken(user.id, req);
    setAuthCookies(res, accessToken, newRefresh);

    return ok(res, {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }),
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token and clear cookies
 */
router.post(
  '/logout',
  asyncHandler(async (req: AuthedRequest, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearAuthCookies(res);
    return ok(res, { loggedOut: true });
  }),
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw AppError.unauthorized();
    return ok(res, {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }),
);

export default router;
