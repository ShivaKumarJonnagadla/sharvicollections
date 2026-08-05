import type { NextFunction, Request, Response } from 'express';

/**
 * Lightweight recursive input sanitiser (XSS / NoSQL-ish injection defence).
 * - Strips `<` and `>` from strings to neutralise HTML/script injection.
 * - Removes keys starting with `$` or containing `.` (operator-injection).
 * Prisma already parameterises queries (SQL-injection safe); this is defence
 * in depth for anything that echoes user input back.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      out[key] = sanitizeValue(val);
    }
    return out;
  }
  return value;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params) as typeof req.params;
  // Note: req.query is a getter in Express 5; mutate in place if writable.
  if (req.query && typeof req.query === 'object') {
    for (const [k, v] of Object.entries(req.query)) {
      (req.query as Record<string, unknown>)[k] = sanitizeValue(v);
    }
  }
  next();
}
