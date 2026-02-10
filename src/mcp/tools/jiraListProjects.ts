import { jiraClient } from "../../integrations/jira/client.js";
import { JiraListProjectsSchema } from "../schemas/jiraListProjects.schema.js";
import { JiraListProjectsOutputSchema } from "../schemas/jiraListProjects.output.schema.js";

export const jiraListProjectsTool = {
  name: "jira_listProjects",
  description: "List all accessible Jira projects",
  schema: JiraListProjectsSchema,
  outputSchema: JiraListProjectsOutputSchema,
  handler: async (args: unknown) => {
    const { correlationId } = JiraListProjectsSchema.parse(args) as any;
    const rawProjects = await jiraClient.getProjects(correlationId);
    
    // Strict mapping to avoid "additional properties" validation error
    const projects = rawProjects.map(p => ({
      key: p.key,
      name: p.name
    }));
    
    // Verify against schema
    JiraListProjectsOutputSchema.parse({ projects });

    return {
      structuredContent: { projects },
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  },
};
