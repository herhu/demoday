
/**
 * Sanitizes user input text to prevent basic injection attacks and normalize commands.
 */
export function sanitizeUserText(text: string): string {
  if (!text) return '';

  // 1. Trim whitespace
  let clean = text.trim();

  // 2. Remove bot mentions (e.g., "@BotName ") if they appear at the start
  // This is a naive implementation; in production, you might want more robust regex
  // focusing on the specific bot name or ID.
  clean = clean.replace(/^@\w+\s+/, '');

  // 3. Normalize whitespace (multiple spaces to single space)
  clean = clean.replace(/\s+/g, ' ');

  // 4. Enforce max length (e.g., 2000 chars)
  if (clean.length > 2000) {
    clean = clean.substring(0, 2000);
  }

  // 5. Basic control character stripping (keep printable ASCII + common file chars)
  // This is optional but good hygiene to prevent weird terminal control codes in logs
  // clean = clean.replace(/[\x00-\x1F\x7F]/g, ''); 

  return clean;
}

/**
 * Asserts that text is safe for processing.
 * Throws an error if text contains forbidden patterns.
 */
export function assertSafeText(text: string): void {
  // Example: Prevent null bytes
  if (text.includes('\0')) {
    throw new Error('Input contains forbidden null bytes');
  }
}
