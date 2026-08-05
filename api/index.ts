/**
 * Vercel Serverless Function entry.
 * Vercel routes every `/api/*` request here (see vercel.json rewrites); the
 * Express app itself mounts the versioned API under `/api/v1`, so the original
 * request path is preserved and handled by the same app used in local dev.
 */
import 'dotenv/config';
import { createApp } from '../apps/backend/src/app.js';

const app = createApp();

export default app;
