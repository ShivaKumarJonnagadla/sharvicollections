import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { AppError } from '../lib/http.js';

type Source = 'body' | 'query' | 'params';

/**
 * Validate a request part against a Zod schema. On success the parsed/coerced
 * value replaces the original so downstream handlers get typed, clean data.
 */
export function validate<S extends ZodTypeAny>(schema: S, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        AppError.badRequest('Validation failed', result.error.flatten().fieldErrors),
      );
    }
    // Store parsed result on a namespaced property to avoid Express 5 getter issues.
    (req as Request & { valid: Record<Source, unknown> }).valid ??= {} as Record<Source, unknown>;
    (req as Request & { valid: Record<Source, unknown> }).valid[source] = result.data;
    if (source === 'body') req.body = result.data;
    next();
  };
}

/** Typed accessor for validated data set by `validate`. */
export function validated<T>(req: Request, source: Source = 'body'): T {
  return (req as Request & { valid: Record<Source, unknown> }).valid[source] as T;
}

export type Infer<S extends ZodTypeAny> = ZodInfer<S>;
