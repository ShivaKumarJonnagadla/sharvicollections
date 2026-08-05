import type { Request } from 'express';
import { prisma } from './prisma.js';

/** Write an audit-log entry. Never throws — auditing must not break requests. */
export async function audit(
  req: Request,
  params: {
    userId?: string | null;
    action: string;
    entity?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata as object | undefined,
        ip: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write log', err);
  }
}
