import { PolicyError } from '../utils/errors.js';

const ALLOWED_TOOLS = new Set([
  'jira.searchIssues',
  'jira.getIssue',
  'jira.listProjects',
  'jira.createIssue',
  'jira.assignIssue',
  'jira.addWorklog'
]);

const ALLOWED_SOURCES = new Set(['google-chat', 'simulator']);
// Removed MAX_TEXT_LENGTH from here since it's handled by pipeline tokens.

export const policy = {
  assertAllowedSource(source: string, correlationId?: string) {
    if (!ALLOWED_SOURCES.has(source)) {
      throw new PolicyError(`Source '${source}' is not allowed by policy.`, correlationId || 'unknown');
    }
  },



  assertAllowedTool(toolName: string, correlationId?: string) {
    if (!ALLOWED_TOOLS.has(toolName)) {
      throw new PolicyError(`Tool '${toolName}' is not allowed by policy.`, correlationId || 'unknown');
    }
  },
};
