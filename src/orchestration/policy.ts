
export class Policy {
  assertWithinLimits(text: string): void {
    if (text.length > 1000) {
      throw new Error('Policy violation: Input text exceeds 1000 characters');
    }
  }

  assertAllowedSource(source: string): void {
    const allowed = ['google-chat'];
    if (!allowed.includes(source)) {
      throw new Error(`Policy violation: Source '${source}' is not allowed`);
    }
  }

  assertAllowedTool(toolName: string): void {
    const allowed = ['jira_search_issues', 'jira_get_issue'];
    if (!allowed.includes(toolName)) {
      throw new Error(`Policy violation: Tool '${toolName}' is not allowed`);
    }
  }
}

export const policy = new Policy();
