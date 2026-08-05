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

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '+46769609978';
export const WHATSAPP_GROUP_URL =
  import.meta.env.VITE_WHATSAPP_GROUP_URL ?? 'https://chat.whatsapp.com/H2h4AXSZytm9yCqNIbrqgm';
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE ?? '0769609978';
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://sharvicollections.vercel.app';
