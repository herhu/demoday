
export class BaseError extends Error {
  public readonly code: string;
  public readonly correlationId?: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, correlationId?: string, details?: unknown) {
    super(message);
    this.code = code;
    this.correlationId = correlationId;
    this.details = details;
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', correlationId, details);
  }
}

export class PolicyError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'POLICY_ERROR', correlationId, details);
  }
}

export class ToolError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'TOOL_ERROR', correlationId, details);
  }
}

export class UpstreamError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'UPSTREAM_ERROR', correlationId, details);
  }
}

export class AuthError extends BaseError {
  constructor(message: string, correlationId?: string, details?: unknown) {
    super(message, 'AUTH_ERROR', correlationId, details);
  }
}

export function toPublicMessage(error: unknown): string {
  if (error instanceof BaseError) {
    const correlationSuffix = error.correlationId ? ` (Request ID: ${error.correlationId})` : '';
    
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return `❌ Invalid request: ${error.message}${correlationSuffix}`;
      case 'POLICY_ERROR':
        return `🚫 Action not allowed: ${error.message}${correlationSuffix}`;
      case 'TOOL_ERROR':
        return `⚠️ Tool execution failed: ${error.message}${correlationSuffix}`;
      case 'UPSTREAM_ERROR':
        return `🔌 External service unavailable. Please try again later.${correlationSuffix}`;
      case 'AUTH_ERROR':
        return `🔒 Authentication failed.${correlationSuffix}`;
      default:
        // Fallback for unknown BaseErrors
        return `An unexpected error occurred.${correlationSuffix}`;
    }
  }

  // Generic fallback
  return `An internal error occurred. Please try again later.`;
}
