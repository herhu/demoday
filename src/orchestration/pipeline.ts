import { ValidationError } from '../utils/errors.js';
import { auditLogger } from '../observability/audit.js';

/**
 * Sequential Processing Data Quality Pipeline
 * Data Input → Schema Validation → Content Quality Check → Safety Validation → Output
 */

// Basic token estimation: 1 token ~= 4 chars in English
const estimateTokenCount = (text: string) => Math.ceil(text.length / 4);

// 1. Token Control & Context Window Threshold
export function validateLengthAndTokens(text: string, correlationId: string, maxTokens: number = 4000) {
    if (!text || text.trim().length === 0) {
        throw new ValidationError('Input is missing or empty (IsComplete check failed).', correlationId);
    }

    const tokens = estimateTokenCount(text);
    if (tokens > maxTokens) {
        auditLogger.log({
            correlationId,
            source: 'pipeline.validateLengthAndTokens',
            event: 'token_limit_exceeded',
            details: { tokens, maxTokens }
        });
        throw new ValidationError(`Context window exceeded. Estimated tokens: ${tokens}. Max allowed: ${maxTokens}.`, correlationId);
    }
}

// 2. Content Quality Check (Valid Characters, Formatting)
export function validateContentQuality(text: string, correlationId: string) {
    // Simple regex for valid content allowing letters, numbers, punctuation, spaces
    if (!(/^[\p{L}\p{N}\p{P}\p{Z}\n]+$/gu.test(text))) {
        throw new ValidationError(`Input contains restricted characters (Content Quality check failed).`, correlationId);
    }

    // Custom check: Avoid explicit [ERROR] tags in input to prevent prompt injection
    if (text.includes('[ERROR]')) {
        throw new ValidationError(`Input contains restricted strings (Content Quality check failed).`, correlationId);
    }

    // We bypass stricter regex checks if they break normal usage, 
    // but this is the gate for character encoding/formatting and basic safety.
}

export const pipeline = {
    validateLengthAndTokens,
    validateContentQuality
};
