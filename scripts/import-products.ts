/**
 * Bulk product importer.
 *
 * Reads data/initial-products.json, uploads each matching image from
 * data/product-images/ to Cloudinary, and upserts a Product (+ ProductImage)
 * into the database.
 *
 * Usage (from repo root, with a filled-in .env):
 *   npm run import:products
 *
 * Requirements in .env:
 *   DATABASE_URL, DIRECT_URL
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Safe to re-run: products are upserted by slug and images are only uploaded
 * when a product has none yet.
 */
import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, ProductBadge } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'data', 'product-images');
const MANIFEST = path.join(ROOT, 'data', 'initial-products.json');
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

const prisma = new PrismaClient();

interface ManifestProduct {
  file: string;
  name: string;
  category?: string;
  priceKr: number;
  badge?: keyof typeof ProductBadge;
  description: string;
}
interface Manifest {
  defaultCategory: string;
  products: ManifestProduct[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/** Resolve the actual file on disk for a manifest `file` (ext-insensitive). */
async function resolveImagePath(fileName: string, dirEntries: string[]): Promise<string | null> {
  const base = path.parse(fileName).name.toLowerCase();
  const match = dirEntries.find((e) => {
    const p = path.parse(e);
    return p.name.toLowerCase() === base && IMAGE_EXTS.includes(p.ext.toLowerCase());
  });
  return match ? path.join(IMAGES_DIR, match) : null;
}

async function main() {
  cloudinary.config({
    cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requireEnv('CLOUDINARY_API_KEY'),
    api_secret: requireEnv('CLOUDINARY_API_SECRET'),
    secure: true,
  });

  const manifest: Manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const folder = `${process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'sharvi-collections'}/products`;

  // Resolve (and cache) categories referenced by the manifest.
  const categoryCache = new Map<string, string>();
  async function categoryId(name: string): Promise<string> {
    const slug = slugify(name);
    if (categoryCache.has(slug)) return categoryCache.get(slug)!;
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    categoryCache.set(slug, cat.id);
    return cat.id;
  }

  let dirEntries: string[] = [];
  try {
    dirEntries = await readdir(IMAGES_DIR);
  } catch {
    console.error(`✖ Image folder not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const item of manifest.products) {
    const slug = slugify(item.name);
    const imagePath = await resolveImagePath(item.file, dirEntries);
    const catId = await categoryId(item.category ?? manifest.defaultCategory);

    const product = await prisma.product.upsert({
      where: { slug },
      update: { description: item.description, priceMinor: item.priceKr * 100, categoryId: catId },
      create: {
        name: item.name,
        slug,
        description: item.description,
        priceMinor: item.priceKr * 100,
        currency: 'SEK',
        stock: 10,
        isPublished: true,
        isFeatured: true,
        badge: (item.badge && ProductBadge[item.badge]) || ProductBadge.NEW,
        categoryId: catId,
      },
      include: { images: true },
    });

    if (!imagePath) {
      console.warn(`⚠  No image file found for "${item.name}" (expected ${item.file}). Product saved without image.`);
      skipped++;
      continue;
    }

    if (product.images.length > 0) {
      console.log(`• "${item.name}" already has an image — skipping upload.`);
      skipped++;
      continue;
    }

    console.log(`↑ Uploading ${path.basename(imagePath)} for "${item.name}"…`);
    const uploaded = await cloudinary.uploader.upload(imagePath, {
      folder,
      public_id: slug,
      overwrite: true,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        alt: item.name,
        width: uploaded.width,
        height: uploaded.height,
        sortOrder: 0,
      },
    });
    created++;
  }

  console.log(`\n✔ Import complete. Images uploaded: ${created}, skipped: ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
