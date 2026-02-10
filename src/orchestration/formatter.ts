
import type { SimplifiedJiraIssue, SimplifiedJiraProject } from '../integrations/jira/types.js';

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

  formatProjectList(projects: SimplifiedJiraProject[]): string {
    if (projects.length === 0) {
      return 'No projects found.';
    }
    const header = `*Available Projects (${projects.length}):*\n`;
    const list = projects.map(p => `- *${p.key}*: ${p.name}`).join('\n');
    return header + list;
  }

  formatHelp(): string {
    return `*Available Jira Commands:*

*/jira search <JQL>*
Search for issues using JQL.
_Example: /jira search project = NJS AND status = Open_

*/jira issue <KEY>*
Get details of a specific issue.
_Example: /jira issue NJS-123_

*/jira mine [projectKey]*
List issues assigned to you (optionally filtered by project).
_Example: /jira mine NJS_

*/jira open [projectKey]*
List open issues (optionally filtered by project), ordered by priority.
_Example: /jira open NJS_

*/jira list <ProjectKey>*
List recent issues in a project.
_Example: /jira list NJS_

*/jira projects*
List all available Jira projects.

*/jira help*
Show this help message.`;
  }

  formatError(correlationId: string, message: string): string {
    return `Error processing request (ID: ${correlationId}): ${message}`;
  }
}

export const formatter = new Formatter();
