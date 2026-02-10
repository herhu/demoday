import { JiraSearchSchema } from "../schemas/jiraSearch.schema.js";
import { JiraSearchOutputSchema } from "../schemas/jiraSearch.output.schema.js";
import { jiraClient } from "../../integrations/jira/client.js";
import { config } from "../../config/env.js";

export const jiraSearchTool = {
  name: "jira_searchIssues",
  description: "Search for issues in Jira using JQL",
  schema: JiraSearchSchema,
  outputSchema: JiraSearchOutputSchema,
  handler: async (args: unknown) => {
    const { jql, maxResults, correlationId } = JiraSearchSchema.parse(args);
    const results = await jiraClient.searchIssues(jql, maxResults, correlationId);

    const simplified = results.issues.map((issue) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name,
      assignee: issue.fields.assignee?.displayName,
      url: `${config.JIRA_BASE_URL}/browse/${issue.key}`,
    }));

    // Verify against schema (optional but good for safety)
    JiraSearchOutputSchema.parse({ issues: simplified });

    return {
      structuredContent: { issues: simplified },
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(simplified, null, 2),
        },
      ],
    };
  },
};
