import { PolicyError } from '../utils/errors.js';

const ALLOWED_TOOLS = new Set([
  'jira.searchIssues',
  'jira.getIssue',
]);

const ALLOWED_SOURCES = new Set(['google-chat', 'simulator']);
const MAX_TEXT_LENGTH = 1000;

export const policy = {
  assertAllowedSource(source: string, correlationId?: string) {
    if (!ALLOWED_SOURCES.has(source)) {
      throw new PolicyError(`Source '${source}' is not allowed by policy.`, correlationId || 'unknown');
    }
  },

  assertWithinLimits(text: string, correlationId?: string) {
    if (text.length > MAX_TEXT_LENGTH) {
      throw new PolicyError(`Input exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`, correlationId || 'unknown');
    }
  },

  assertAllowedTool(toolName: string, correlationId?: string) {
    if (!ALLOWED_TOOLS.has(toolName)) {
      throw new PolicyError(`Tool '${toolName}' is not allowed by policy.`, correlationId || 'unknown');
    }
  },
};
