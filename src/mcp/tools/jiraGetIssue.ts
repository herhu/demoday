import { JiraGetIssueSchema } from '../schemas/jiraGetIssue.schema.js';
import { JiraGetIssueOutputSchema } from '../schemas/jiraGetIssue.output.schema.js';
import { jiraClient } from '../../integrations/jira/client.js';
import { config } from '../../config/env.js';

export const jiraGetIssueTool = {
  name: 'jira_getIssue',
  description: 'Get details of a specific Jira issue by key',
  schema: JiraGetIssueSchema,
  outputSchema: JiraGetIssueOutputSchema,
  handler: async (args: unknown) => {
    const { issueKey, correlationId } = JiraGetIssueSchema.parse(args);
    const issue = await jiraClient.getIssue(issueKey, correlationId);

    const simplified = {
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name,
      assignee: issue.fields.assignee?.displayName,
      url: `${config.JIRA_BASE_URL}/browse/${issue.key}`,
    };

    // Verify against schema
    JiraGetIssueOutputSchema.parse(simplified);

    return {
      structuredContent: simplified,
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(simplified, null, 2),
        },
      ],
    };
  },
};
