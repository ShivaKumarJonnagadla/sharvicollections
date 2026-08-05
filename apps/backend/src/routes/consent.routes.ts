import { Router } from 'express';
import { consentSchema, CONSENT_POLICY_VERSION, type ConsentInput } from '@sharvi/shared';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, ok } from '../lib/http.js';
import { validate, validated } from '../middleware/validate.js';

const router = Router();

/**
 * @openapi
 * /consent:
 *   post:
 *     tags: [Consent]
 *     summary: Record a GDPR consent event (grant / revoke / update)
 */
router.post(
  '/',
  validate(consentSchema),
  asyncHandler(async (req, res) => {
    const input = validated<ConsentInput>(req);
    await prisma.consentLog.create({
      data: {
        visitorId: input.visitorId,
        action: input.action,
        necessary: input.necessary,
        preferences: input.preferences,
        policyVersion: CONSENT_POLICY_VERSION,
        ip: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
      },
    });
    return ok(res, { recorded: true, policyVersion: CONSENT_POLICY_VERSION });
  }),
);

export default router;
