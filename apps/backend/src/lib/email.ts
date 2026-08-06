import nodemailer from 'nodemailer';
import { formatSEK, type OrderDTO } from '@sharvi/shared';
import { env } from '../config/env.js';

/** Small Cloudinary thumbnail for email (email clients block heavy images). */
function thumb(url: string | null): string {
  if (!url) return '';
  return url.includes('/upload/') ? url.replace('/upload/', '/upload/w_120,h_150,c_fill,q_auto,f_auto/') : url;
}

function renderOrderEmail(order: OrderDTO): string {
  const trackUrl = `${env.SITE_URL}/order/${order.orderNumber}`;
  const rows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;width:64px;vertical-align:top">
          ${it.productImage ? `<img src="${thumb(it.productImage)}" width="56" height="70" style="border-radius:8px;object-fit:cover" alt="">` : ''}
        </td>
        <td style="padding:10px 8px;vertical-align:top;font-size:14px;color:#241a1d">
          ${it.productName}<br><span style="color:#8a7a80">× ${it.quantity}</span>
        </td>
        <td style="padding:10px 0;vertical-align:top;text-align:right;font-size:14px;color:#241a1d">
          ${formatSEK(it.lineTotalMinor, 'sv')}
        </td>
      </tr>`,
    )
    .join('');

  const shipping = order.shippingRequired
    ? `<tr><td style="color:#8a7a80;font-size:14px;padding:4px 0">Shipping</td><td style="text-align:right;font-size:14px;padding:4px 0">${formatSEK(order.shippingCostMinor, 'sv')}</td></tr>`
    : '';

  const address = order.shippingRequired
    ? `<p style="margin:16px 0 0;font-size:13px;color:#8a7a80">Ships to: ${[order.shippingAddress, order.shippingPostalCode, order.shippingCity, order.shippingCounty, order.shippingCountry].filter(Boolean).join(', ')}</p>`
    : '';

  return `<!doctype html><html><body style="margin:0;background:#fbf7f4;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:24px">
      <div style="text-align:center;padding:8px 0 20px">
        <div style="font-size:22px;color:#7c1f3f;font-weight:700">Sharvi Collections</div>
        <div style="font-size:12px;color:#a9842c">Affordable Multicultural Jewelry</div>
      </div>
      <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 16px rgba(36,26,29,.08)">
        <h1 style="margin:0 0 4px;font-size:20px;color:#7c1f3f">Thanks for your order, ${order.customerName}!</h1>
        <p style="margin:0 0 16px;color:#8a7a80;font-size:14px">
          Order <strong>${order.orderNumber}</strong> — we've received it and will be in touch shortly.
        </p>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #f0e0e6">${rows}</table>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #f0e0e6;margin-top:8px">
          <tr><td style="color:#8a7a80;font-size:14px;padding:4px 0">Subtotal</td><td style="text-align:right;font-size:14px;padding:4px 0">${formatSEK(order.subtotalMinor, 'sv')}</td></tr>
          ${shipping}
          <tr><td style="font-size:16px;font-weight:700;color:#7c1f3f;padding:8px 0">Total</td><td style="text-align:right;font-size:16px;font-weight:700;color:#7c1f3f;padding:8px 0">${formatSEK(order.totalMinor, 'sv')}</td></tr>
        </table>
        ${address}
        <div style="text-align:center;margin-top:24px">
          <a href="${trackUrl}" style="display:inline-block;background:#7c1f3f;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px">Track your order</a>
        </div>
        <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8a7a80">
          Payment: ${order.paymentMethod}${order.paymentMethod === 'SWISH' ? ` · Reference: ${order.orderNumber}` : ''}
        </p>
      </div>
      <p style="text-align:center;color:#b3a3a8;font-size:12px;margin-top:16px">Älmhult, Sweden · Sharvi Collections</p>
    </div>
  </body></html>`;
}

interface SendOpts {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
}

/** Send via the store's Gmail (App Password) — delivers to any recipient. */
async function sendViaGmail(opts: SendOpts): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
  // Gmail forces the From to the authenticated account; keep a friendly name.
  await transporter.sendMail({
    from: `Sharvi Collections <${env.GMAIL_USER}>`,
    to: opts.to.join(', '),
    ...(opts.cc && opts.cc.length ? { cc: opts.cc.join(', ') } : {}),
    subject: opts.subject,
    html: opts.html,
  });
}

/** Fallback: send via Resend (subject to its domain-verification rules). */
async function sendViaResend(opts: SendOpts): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: opts.to,
      ...(opts.cc && opts.cc.length ? { cc: opts.cc } : {}),
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) console.error('[email] Resend responded', res.status, await res.text());
}

/**
 * Deliver an order email to the customer (CC store owner). Never throws.
 * - Gmail (preferred): reaches any recipient — no domain needed.
 * - Resend (fallback): shared sender only reaches the account owner, so we send
 *   to the owner until a verified domain is configured.
 */
async function deliver(order: OrderDTO, subject: string, html: string): Promise<void> {
  const owner = env.ORDER_NOTIFY_EMAIL;
  try {
    if (env.gmailConfigured) {
      await sendViaGmail({
        to: [order.customerEmail],
        cc: owner ? [owner] : undefined,
        subject,
        html,
      });
      return;
    }
    if (env.RESEND_API_KEY) {
      const usingSharedSender = env.EMAIL_FROM.includes('onboarding@resend.dev');
      if (usingSharedSender) {
        if (owner) await sendViaResend({ to: [owner], subject: `[Order] ${subject}`, html });
      } else {
        await sendViaResend({
          to: [order.customerEmail],
          cc: owner ? [owner] : undefined,
          subject,
          html,
        });
      }
      return;
    }
    console.warn('[email] no email transport configured — skipping order email');
  } catch (err) {
    console.error('[email] failed to send email', err);
  }
}

export async function sendOrderConfirmation(order: OrderDTO): Promise<void> {
  await deliver(order, `Your Sharvi Collections order ${order.orderNumber}`, renderOrderEmail(order));
}

/** Cancellation email content. */
function renderCancellationEmail(order: OrderDTO): string {
  return `<!doctype html><html><body style="margin:0;background:#fbf7f4;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:24px">
      <div style="text-align:center;padding:8px 0 20px">
        <div style="font-size:22px;color:#7c1f3f;font-weight:700">Sharvi Collections</div>
      </div>
      <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 16px rgba(36,26,29,.08)">
        <h1 style="margin:0 0 4px;font-size:20px;color:#7c1f3f">Order ${order.orderNumber} cancelled</h1>
        <p style="margin:0 0 12px;color:#8a7a80;font-size:14px">
          Hi ${order.customerName}, your order has been cancelled as requested.
        </p>
        ${order.cancelReason ? `<p style="font-size:14px;color:#241a1d"><strong>Reason:</strong> ${order.cancelReason}</p>` : ''}
        <p style="font-size:14px;color:#241a1d"><strong>Order total was:</strong> ${formatSEK(order.totalMinor, 'sv')}</p>
        <p style="margin-top:16px;font-size:13px;color:#8a7a80">
          Questions about cancellation or refunds? Message us on WhatsApp and we'll help.
        </p>
      </div>
      <p style="text-align:center;color:#b3a3a8;font-size:12px;margin-top:16px">Älmhult, Sweden · Sharvi Collections</p>
    </div>
  </body></html>`;
}

export async function sendOrderCancellation(order: OrderDTO): Promise<void> {
  await deliver(
    order,
    `Your Sharvi Collections order ${order.orderNumber} was cancelled`,
    renderCancellationEmail(order),
  );
}
