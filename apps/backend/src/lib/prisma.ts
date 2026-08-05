import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * Single PrismaClient instance. In serverless/dev with hot reload we cache it
 * on globalThis to avoid exhausting Neon connections across invocations.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['warn', 'error'] : ['error'],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;
