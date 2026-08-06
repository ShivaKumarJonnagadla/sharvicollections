import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Build an optimised Cloudinary URL with on-the-fly transformations. */
export function cloudinaryUrl(
  url: string,
  opts: { width?: number; height?: number; crop?: 'fill' | 'fit' } = {},
): string {
  if (!url.includes('/upload/')) return url;
  const parts: string[] = ['f_auto', 'q_auto'];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);
  if (opts.crop) parts.push(`c_${opts.crop}`);
  return url.replace('/upload/', `/upload/${parts.join(',')}/`);
}

/** Map a colour name to a swatch hex (best-effort; falls back to a neutral). */
export function colorToHex(name: string): string {
  const key = name.trim().toLowerCase();
  const map: Record<string, string> = {
    gold: '#d4af37',
    'rose gold': '#b76e79',
    rosegold: '#b76e79',
    'white gold': '#e8e8e8',
    silver: '#c0c0c0',
    champagne: '#f7e7ce',
    pearl: '#f4f0e6',
    white: '#f8f8f8',
    black: '#1c1c1c',
    grey: '#9ca3af',
    gray: '#9ca3af',
    brown: '#6b4a2b',
    bronze: '#cd7f32',
    copper: '#b87333',
    red: '#c0392b',
    ruby: '#9b111e',
    maroon: '#7c1f3f',
    pink: '#ec9bb6',
    rose: '#e2a0b4',
    blue: '#2f5fa0',
    navy: '#1f2d5a',
    green: '#2e7d4f',
    emerald: '#1f8a5b',
    amethyst: '#9966cc',
    purple: '#7d4b9a',
    lavender: '#c7b8ea',
    turquoise: '#40c4b4',
    yellow: '#e6c200',
    orange: '#e08a2e',
    multicolour: '#c94873',
    multicolor: '#c94873',
  };
  return map[key] ?? '#c9a98f';
}

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '+46769609978';
export const WHATSAPP_GROUP_URL =
  import.meta.env.VITE_WHATSAPP_GROUP_URL ?? 'https://chat.whatsapp.com/H2h4AXSZytm9yCqNIbrqgm';
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE ?? '0769609978';
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://sharvicollections.vercel.app';
