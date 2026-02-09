
import type { SimplifiedJiraIssue } from '../integrations/jira/types.js';

export class Formatter {
  formatJiraIssue(issue: SimplifiedJiraIssue): string {
    const priority = issue.priority || 'None';
    const assignee = issue.assignee || 'Unassigned';
    return `*${issue.key}*: ${issue.summary}\nStatus: ${issue.status} | Priority: ${priority} | Assignee: ${assignee}`;
  }

  formatJiraList(issues: SimplifiedJiraIssue[]): string {
    if (issues.length === 0) {
      return 'No issues found.';
    }
    const header = `Found ${issues.length} issues:\n`;
    const list = issues.map(i => `- ${this.formatJiraIssue(i)}`).join('\n');
    return header + list;
  }

  formatHelp(): string {
    return `Available commands:
- /jira search <JQL>
- /jira open [projectKey]
- /jira mine [projectKey]
- /jira issue <KEY>`;
  }

  formatError(correlationId: string, message: string): string {
    return `Error processing request (ID: ${correlationId}): ${message}`;
  }
}

export const formatter = new Formatter();
