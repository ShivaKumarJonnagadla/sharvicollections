/**
 * Generates the PWA / favicon PNG assets as solid brand-coloured tiles with a
 * gold diamond glyph — no external image tooling required (pure zlib PNG writer).
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '../apps/frontend/public');

const MAROON = [124, 31, 63];
const GOLD = [220, 184, 87];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size, { maskable = false } = {}) {
  const bg = MAROON;
  const rows = [];
  const cx = size / 2;
  const cy = size / 2;
  // Diamond "gem" glyph sized to leave safe padding (maskable => smaller).
  const r = size * (maskable ? 0.26 : 0.32);
  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte
    for (let x = 0; x < size; x++) {
      const inDiamond = Math.abs(x - cx) / r + Math.abs(y - cy) / r <= 1;
      const [rr, gg, bb] = inDiamond ? GOLD : bg;
      row.push(rr, gg, bb, 255);
    }
    rows.push(Buffer.from(row));
  }
  const raw = Buffer.concat(rows);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(resolve(PUBLIC, 'icons'), { recursive: true });
const targets = [
  ['icons/icon-192.png', 192, {}],
  ['icons/icon-512.png', 512, {}],
  ['icons/icon-512-maskable.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, {}],
  ['og-image.png', 1200, {}], // square-ish OG fallback
];
for (const [name, size, opts] of targets) {
  writeFileSync(resolve(PUBLIC, name), png(size, opts));
  console.log('wrote', name);
}
