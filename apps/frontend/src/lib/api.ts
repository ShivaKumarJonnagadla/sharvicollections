/**
 * Typed fetch wrapper around the Sharvi Collections API.
 * - Sends cookies (credentials) for auth.
 * - Injects the CSRF token (double-submit) on mutating requests.
 * - Normalises the { success, data } envelope and throws typed ApiError.
 */
const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Read the non-HttpOnly CSRF cookie set by the backend. */
function readCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)sc_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfPrimed = false;
/** Ensure a CSRF cookie exists before the first mutation. */
async function ensureCsrf(): Promise<void> {
  if (csrfPrimed || readCsrfToken()) {
    csrfPrimed = true;
    return;
  }
  await fetch(`${API_URL}/csrf-token`, { credentials: 'include' }).catch(() => undefined);
  csrfPrimed = true;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Pass FormData directly (skips JSON serialisation). */
  formData?: FormData;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const isMutation = method !== 'GET';
  if (isMutation) await ensureCsrf();

  const headers: Record<string, string> = {};
  if (!options.formData) headers['Content-Type'] = 'application/json';
  if (isMutation) {
    const token = readCsrfToken();
    if (token) headers['x-csrf-token'] = token;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    signal: options.signal,
    body: options.formData ?? (options.body ? JSON.stringify(options.body) : undefined),
  });

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const err = (payload as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'ERROR',
      err?.message ?? `Request failed (${res.status})`,
      err?.details,
    );
  }

  return (payload as { data: T }).data;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => apiRequest<T>(path, { method: 'POST', formData }),
};

export { API_URL };
