import { JiraAssignIssueSchema } from "../schemas/jiraAssignIssue.schema.js";
import { jiraClient } from "../../integrations/jira/client.js";

export const jiraAssignIssueTool = {
    name: "jira_assignIssue",
    description: "Assign an issue in Jira",
    schema: JiraAssignIssueSchema,
    handler: async (args: unknown) => {
        const { issueKey, assigneeId, correlationId } = JiraAssignIssueSchema.parse(args);
        await jiraClient.assignIssue(issueKey, assigneeId, correlationId);

        return {
            structuredContent: { issueKey, assigneeId },
            content: [
                {
                    type: "text" as const,
                    text: `Issue ${issueKey} assigned to ${assigneeId}.`,
                },
            ],
        };
    },
};
