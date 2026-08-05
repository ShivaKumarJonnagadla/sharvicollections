/**
 * Generate all app icons from a brand logo PNG using macOS `sips`.
 *
 *   npm run brand:icons              # uses apps/frontend/public/brand/logo-lotus.png
 *   npm run brand:icons -- monogram  # uses logo-monogram.png
 *
 * Produces: brand/logo.png (header), apple-touch-icon.png, og-image.png,
 * icons/icon-192.png, icons/icon-512.png, icons/icon-512-maskable.png,
 * and copies the source to favicon-source.png (referenced by index.html).
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '../apps/frontend/public');
const which = (process.argv[2] || 'lotus').toLowerCase();
const source = resolve(PUBLIC, 'brand', `logo-${which}.png`);

if (!existsSync(source)) {
  console.error(`✖ Logo not found: ${source}`);
  console.error('  Save your PNG there first (see apps/frontend/public/brand/README.md).');
  process.exit(1);
}

mkdirSync(resolve(PUBLIC, 'icons'), { recursive: true });

function resizePng(src, dest, size) {
  execFileSync('sips', ['-s', 'format', 'png', '-z', String(size), String(size), src, '--out', dest], {
    stdio: 'ignore',
  });
  console.log('wrote', dest.replace(PUBLIC + '/', ''));
}

// Header logo (kept crisp at 512), favicon source, and platform icons.
copyFileSync(source, resolve(PUBLIC, 'brand/logo.png'));
resizePng(source, resolve(PUBLIC, 'brand/logo.png'), 512);
resizePng(source, resolve(PUBLIC, 'favicon-source.png'), 64);
resizePng(source, resolve(PUBLIC, 'apple-touch-icon.png'), 180);
resizePng(source, resolve(PUBLIC, 'og-image.png'), 1200);
resizePng(source, resolve(PUBLIC, 'icons/icon-192.png'), 192);
resizePng(source, resolve(PUBLIC, 'icons/icon-512.png'), 512);
resizePng(source, resolve(PUBLIC, 'icons/icon-512-maskable.png'), 512);

console.log('\n✔ Brand icons generated from', `logo-${which}.png`);
