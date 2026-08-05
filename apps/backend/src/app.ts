import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { openapiDocument } from './swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { csrfProtection } from './middleware/csrf.js';
import { globalLimiter } from './middleware/rateLimit.js';

/** Build and configure the Express application (shared by server + serverless). */
export function createApp(): Express {
  const app = express();

  // Behind Vercel/other proxies — trust the first proxy for correct req.ip.
  app.set('trust proxy', 1);

  // --- Security headers (Helmet / OWASP) ---
  app.use(
    helmet({
      contentSecurityPolicy: env.isProd ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // --- CORS (credentials + explicit allow-list) ---
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server (no Origin header) and the allow-list.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // --- Input hardening ---
  app.use(sanitizeInput);
  app.use(globalLimiter);
  app.use(csrfProtection);

  // --- API documentation ---
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.get('/api/docs.json', (_req, res) => res.json(openapiDocument));

  // --- Versioned API ---
  app.use(`/api/${env.API_VERSION}`, routes);

  // 404 + centralized error handling.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
