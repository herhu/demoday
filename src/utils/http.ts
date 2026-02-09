
import { UpstreamError, AuthError } from './errors.js';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  correlationId?: string;
}

export async function httpRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = 10000, retries = 2, correlationId, ...fetchOptions } = options;
  let attempt = 0;

  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...fetchOptions.headers,
          ...(correlationId ? { 'X-Correlation-ID': correlationId } : {}),
        },
      });
      clearTimeout(id);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AuthError(`Authentication failed: ${response.statusText}`, correlationId);
        }
        if (response.status >= 500 || response.status === 429) {
          // Retryable errors
          if (attempt < retries) {
            attempt++;
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        throw new UpstreamError(`HTTP error ${response.status}: ${response.statusText}`, correlationId);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      clearTimeout(id);
      const isAbort = error instanceof Error && error.name === 'AbortError';
      
      if (isAbort) {
         if (attempt < retries) {
            attempt++;
            continue;
         }
         throw new UpstreamError(`Request timed out after ${timeout}ms`, correlationId, error);
      }

      // If it's already one of our typed errors, rethrow
      if (error instanceof UpstreamError || error instanceof AuthError) {
        throw error;
      }

      // Network errors are retryable
      if (attempt < retries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      throw new UpstreamError(
        error instanceof Error ? error.message : 'Unknown network error',
        correlationId,
        error
      );
    }
  }

  throw new UpstreamError('Request failed after retries', correlationId);
}
