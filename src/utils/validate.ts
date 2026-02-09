
import { z } from 'zod';
import { ValidationError } from './errors.js';

export function validate<T>(schema: z.Schema<T>, data: unknown, correlationId?: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Format Zod errors into a readable string
    const errorMessage = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new ValidationError(`Validation failed: ${errorMessage}`, correlationId, result.error);
  }
  return result.data;
}
