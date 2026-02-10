import { UpstreamError, AuthError } from "./errors.js";

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  correlationId?: string;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers as Record<string, string>;
}

export async function httpRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = 10000, retries = 2, correlationId, ...fetchOptions } = options;
  let attempt = 0;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const baseHeaders = normalizeHeaders(fetchOptions.headers);
      const headers: Record<string, string> = {
        ...baseHeaders,
        ...(correlationId ? { "X-Correlation-ID": correlationId } : {}),
      };

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AuthError(`Authentication failed: ${response.statusText}`, correlationId);
        }

        // Retryable
        if (response.status >= 500 || response.status === 429) {
          if (attempt < retries) {
            attempt++;
            const retryAfter = response.headers.get("retry-after");
            const delayMs = retryAfter
              ? Number(retryAfter) * 1000
              : Math.pow(2, attempt - 1) * 1000; // 1s,2s,4s...

            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }
        }

        throw new UpstreamError(`HTTP error ${response.status}: ${response.statusText}`, correlationId);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      clearTimeout(timer);

      const isAbort = error instanceof Error && error.name === "AbortError";
      if (isAbort) {
        if (attempt < retries) {
          attempt++;
          continue;
        }
        throw new UpstreamError(`Request timed out after ${timeout}ms`, correlationId, error);
      }

      if (error instanceof UpstreamError || error instanceof AuthError) {
        throw error;
      }

      if (attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      throw new UpstreamError(
        error instanceof Error ? error.message : "Unknown network error",
        correlationId,
        error
      );
    }
  }

  throw new UpstreamError("Request failed after retries", correlationId);
}
