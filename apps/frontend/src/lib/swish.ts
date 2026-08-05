import { WHATSAPP_NUMBER } from './utils';

/** Swish payee alias (digits only, e.g. 46769609978). */
export const SWISH_NUMBER = WHATSAPP_NUMBER.replace(/[^0-9]/g, '');

/**
 * Build a Swish universal/deep link that opens the Swish app pre-filled with
 * the payee number, amount and message (order reference). On devices without
 * Swish, the app.swish.nu URL shows an install fallback page.
 * Docs: https://developer.swish.nu/documentation/guides/create-a-payment-request
 */
export function swishLink(amountKr: number, message: string): string {
  const params = new URLSearchParams({
    sw: SWISH_NUMBER,
    amt: amountKr.toFixed(2),
    cur: 'SEK',
    msg: message,
    edit: 'msg',
  });
  return `https://app.swish.nu/1/p/sw/?${params.toString()}`;
}
