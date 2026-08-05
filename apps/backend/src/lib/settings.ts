import { prisma } from './prisma.js';

export interface StoreSettings {
  shippingCostKr: number;
  announcement: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  shippingCostKr: 49,
  announcement: '',
};

const KEYS = {
  shipping: 'store.shippingCostKr',
  announcement: 'store.announcement',
} as const;

/** Read the editable store settings (with sane defaults). */
export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [KEYS.shipping, KEYS.announcement] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const shipping = map.get(KEYS.shipping);
  const announcement = map.get(KEYS.announcement);
  return {
    shippingCostKr: typeof shipping === 'number' ? shipping : DEFAULT_SETTINGS.shippingCostKr,
    announcement: typeof announcement === 'string' ? announcement : DEFAULT_SETTINGS.announcement,
  };
}

export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  if (patch.shippingCostKr !== undefined) {
    await prisma.setting.upsert({
      where: { key: KEYS.shipping },
      create: { key: KEYS.shipping, value: patch.shippingCostKr },
      update: { value: patch.shippingCostKr },
    });
  }
  if (patch.announcement !== undefined) {
    await prisma.setting.upsert({
      where: { key: KEYS.announcement },
      create: { key: KEYS.announcement, value: patch.announcement },
      update: { value: patch.announcement },
    });
  }
  return getStoreSettings();
}
