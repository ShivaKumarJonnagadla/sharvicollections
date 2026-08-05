/**
 * Prisma seed script.
 * - Seeds the exact category / subcategory taxonomy for Sharvi Collections.
 * - Creates the bootstrap admin user from env vars (never hardcoded).
 * - Inserts a handful of sample products so the storefront renders on first run.
 *
 * Run with:  npm run prisma:seed
 */
import { PrismaClient, ProductBadge } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/** Exact taxonomy provided by the business. Order is preserved. */
const TAXONOMY: { category: string; subcategories: string[] }[] = [
  {
    category: 'Necklace',
    subcategories: [
      'Chain',
      'Pendant',
      'Pearl Necklace',
      'Pendant Set',
      'Shell Necklace',
      'Necklace Set',
      'Oxidised Necklace',
      'Western Necklace',
      'Anti tarnish Stainless Steel Necklace',
      'Multi Layered Necklace',
      'Chain Necklace',
      'Xuping Anti tarnish Stainless Steel Necklace',
      'Korean Necklace',
      'Antique Necklace Set',
    ],
  },
  {
    category: 'Earring',
    subcategories: [
      'Indo Western Earring',
      'Antique Earring',
      'Pearl Earring',
      'Western Earrings',
      'Oxidised Earring',
      'Natural Cultural Pearl Earring',
      'Stud Earring',
      'Anti tarnish Stainless Steel Earring',
      'Korean Earring',
      'Xuping Earring',
      'Hoops Earring',
    ],
  },
  {
    category: 'Bracelet & Bangles',
    subcategories: [
      'Natural Cultural Pearl Bracelet',
      'Bangles Bracelet',
      'CZ Bracelet',
      'Kadaa',
      'Anti Tarnish Stainless Steel Kada',
      'Anti Tarnish Stainless Steel Bracelet',
      'Korean Bracelet',
      'Xuping Anti Tarnish Stainless Steel Bracelet',
      'Cuff Kada',
    ],
  },
  {
    category: 'Finger Ring',
    subcategories: [
      'Anti tarnish Stainless Steel Rings',
      'CZ Finger Ring',
      'Adjustable Finger Ring',
    ],
  },
  { category: 'Anklet', subcategories: [] },
  {
    category: 'Trending Collections',
    subcategories: [
      'Antique Jewellery',
      'Korean Jewellery',
      'Mens Jewellery',
      'Stainless Steel Jewellery',
    ],
  },
  { category: 'New Arrivals', subcategories: [] },
];

/** URL-safe slug generator (shared logic mirrored in packages/shared). */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function seedTaxonomy() {
  console.log('→ Seeding categories & subcategories…');
  for (let c = 0; c < TAXONOMY.length; c++) {
    const { category, subcategories } = TAXONOMY[c];
    const cat = await prisma.category.upsert({
      where: { slug: slugify(category) },
      update: { name: category, sortOrder: c },
      create: { name: category, slug: slugify(category), sortOrder: c },
    });

    for (let s = 0; s < subcategories.length; s++) {
      const subName = subcategories[s];
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: cat.id, slug: slugify(subName) } },
        update: { name: subName, sortOrder: s },
        create: {
          name: subName,
          slug: slugify(subName),
          sortOrder: s,
          categoryId: cat.id,
        },
      });
    }
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? 'Sharvi Admin';

  if (!email || !password) {
    console.warn('⚠  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin creation.');
    return;
  }

  console.log(`→ Seeding admin user (${email})…`);
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', name, isActive: true },
    create: { email, name, passwordHash, role: 'ADMIN' },
  });
}

async function seedSampleProducts() {
  console.log('→ Seeding sample products…');
  const necklace = await prisma.category.findUnique({ where: { slug: slugify('Necklace') } });
  const earring = await prisma.category.findUnique({ where: { slug: slugify('Earring') } });
  if (!necklace || !earring) return;

  const pearlNecklace = await prisma.subcategory.findFirst({
    where: { categoryId: necklace.id, slug: slugify('Pearl Necklace') },
  });
  const studEarring = await prisma.subcategory.findFirst({
    where: { categoryId: earring.id, slug: slugify('Stud Earring') },
  });

  const samples = [
    {
      name: 'Aurora Pearl Necklace',
      priceMinor: 34900,
      compareAtMinor: 49900,
      categoryId: necklace.id,
      subcategoryId: pearlNecklace?.id ?? null,
      badge: ProductBadge.SALE,
      isFeatured: true,
      description:
        'A timeless freshwater pearl necklace with an anti-tarnish clasp — everyday elegance for any occasion.',
    },
    {
      name: 'Meera Oxidised Statement Earrings',
      priceMinor: 24900,
      categoryId: earring.id,
      subcategoryId: studEarring?.id ?? null,
      badge: ProductBadge.TRENDING,
      isFeatured: true,
      description: 'Hand-finished oxidised earrings inspired by classic Indian craftsmanship.',
    },
    {
      name: 'Nordic Shell Necklace',
      priceMinor: 19900,
      categoryId: necklace.id,
      subcategoryId: null,
      badge: ProductBadge.NEW,
      isFeatured: true,
      description: 'Minimal Scandinavian-inspired shell pendant on a delicate stainless-steel chain.',
    },
  ];

  for (const s of samples) {
    await prisma.product.upsert({
      where: { slug: slugify(s.name) },
      update: {},
      create: {
        ...s,
        slug: slugify(s.name),
        sku: slugify(s.name).toUpperCase().slice(0, 12),
        stock: 25,
        images: {
          create: [
            {
              url: 'https://res.cloudinary.com/demo/image/upload/w_800/sample.jpg',
              publicId: 'sample-placeholder',
              alt: s.name,
              sortOrder: 0,
            },
          ],
        },
      },
    });
  }
}

async function seedSettings() {
  console.log('→ Seeding storefront settings…');
  await prisma.setting.upsert({
    where: { key: 'consent.policyVersion' },
    update: {},
    create: { key: 'consent.policyVersion', value: '2026-01' },
  });
}

async function main() {
  await seedTaxonomy();
  await seedAdmin();
  await seedSampleProducts();
  await seedSettings();
  console.log('✔ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
