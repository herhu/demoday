import { JiraAddWorklogSchema } from "../schemas/jiraAddWorklog.schema.js";
import { jiraClient } from "../../integrations/jira/client.js";

export const jiraAddWorklogTool = {
    name: "jira_addWorklog",
    description: "Add a worklog to a Jira issue",
    schema: JiraAddWorklogSchema,
    handler: async (args: unknown) => {
        const { issueKey, timeSpent, correlationId } = JiraAddWorklogSchema.parse(args);
        const result = await jiraClient.addWorklog(issueKey, timeSpent, correlationId);

        return {
            structuredContent: { result },
            content: [
                {
                    type: "text" as const,
                    text: `Logged ${timeSpent} to ${issueKey}.`,
                },
            ],
        };
    },
};
