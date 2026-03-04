import { JiraCreateIssueSchema } from "../schemas/jiraCreateIssue.schema.js";
import { jiraClient } from "../../integrations/jira/client.js";


export const jiraCreateIssueTool = {
    name: "jira_createIssue",
    description: "Create an issue in Jira",
    schema: JiraCreateIssueSchema,
    handler: async (args: unknown) => {
        const { projectKey, summary, issueType, correlationId } = JiraCreateIssueSchema.parse(args);
        const result = await jiraClient.createIssue(projectKey, summary, issueType, correlationId);

        return {
            structuredContent: { result },
            content: [
                {
                    type: "text" as const,
                    text: `Issue ${result.key || 'created'} successfully.`,
                },
            ],
        };
    },
};
