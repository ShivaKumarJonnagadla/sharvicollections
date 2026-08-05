import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load .env from the nearest likely location so local dev works no matter the
// cwd (repo root or apps/backend). dotenv never overrides variables already set
// by the platform, so this is a no-op in production (Vercel/Docker).
for (const candidate of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(process.cwd(), '../../../.env'),
]) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate });
    break;
  }
}

/**
 * Validates and types all environment variables at startup.
 * Fails fast with a clear message if anything required is missing.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('sharvi-collections'),

  // Email (Resend) + public site URL used in order emails / tracking links.
  // Preferred: send via the store's own Gmail (App Password) — no domain needed.
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  // Fallback: Resend.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Sharvi Collections <onboarding@resend.dev>'),
  // Store owner — CC'd on customer emails; sole recipient with the Resend shared sender.
  ORDER_NOTIFY_EMAIL: z.string().optional(),
  SITE_URL: z.string().default('https://sharvicollections.vercel.app'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed');
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV === 'development',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  cloudinaryConfigured: Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET,
  ),
  gmailConfigured: Boolean(raw.GMAIL_USER && raw.GMAIL_APP_PASSWORD),
  emailConfigured: Boolean((raw.GMAIL_USER && raw.GMAIL_APP_PASSWORD) || raw.RESEND_API_KEY),
};

export type Env = typeof env;
