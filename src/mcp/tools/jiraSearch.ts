
import { JiraSearchSchema } from '../schemas/jiraSearch.schema.js';
import { jiraClient } from '../../integrations/jira/client.js';

export const jiraSearchTool = {
  name: 'jira_search_issues',
  description: 'Search for issues in Jira using JQL',
  schema: JiraSearchSchema,
  handler: async (args: unknown) => {
    const { jql, maxResults } = JiraSearchSchema.parse(args);
    const results = await jiraClient.searchIssues(jql, maxResults);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(results.issues.map(issue => ({
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status.name,
            priority: issue.fields.priority?.name,
            assignee: issue.fields.assignee?.displayName,
          })), null, 2),
        },
      ],
    };
  },
};
