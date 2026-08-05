import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '../lib/http.js';
import { getStoreSettings, updateStoreSettings } from '../lib/settings.js';
import { audit } from '../lib/audit.js';
import { validate, validated } from '../middleware/validate.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

/** Public: storefront reads announcement + shipping cost. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    return ok(res, await getStoreSettings());
  }),
);

const updateSchema = z.object({
  shippingCostKr: z.coerce.number().int().min(0).max(100000).optional(),
  announcement: z.string().max(300).optional(),
});

/** (Admin) Update store settings. */
router.patch(
  '/admin',
  requireAuth,
  requireRole('ADMIN'),
  validate(updateSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const patch = validated<z.infer<typeof updateSchema>>(req);
    const updated = await updateStoreSettings(patch);
    await audit(req, { action: 'settings.update', userId: req.user!.sub, metadata: patch });
    return ok(res, updated);
  }),
);

export default router;
