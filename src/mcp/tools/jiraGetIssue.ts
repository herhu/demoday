
import { JiraGetIssueSchema } from '../schemas/jiraGetIssue.schema.js';
import { jiraClient } from '../../integrations/jira/client.js';

export const jiraGetIssueTool = {
  name: 'jira_get_issue',
  description: 'Get details of a specific Jira issue by key',
  schema: JiraGetIssueSchema,
  handler: async (args: unknown) => {
    const { issueKey } = JiraGetIssueSchema.parse(args);
    const issue = await jiraClient.getIssue(issueKey);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            key: issue.key,
            summary: issue.fields.summary,
            description: issue.fields.description,
            status: issue.fields.status.name,
            priority: issue.fields.priority?.name,
            assignee: issue.fields.assignee?.displayName,
          }, null, 2),
        },
      ],
    };
  },
};
