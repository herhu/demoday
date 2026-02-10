import { z } from "zod";
import { JiraIssueSummarySchema } from "./jiraShared.schema.js";

export const JiraSearchOutputSchema = z.object({
  issues: z.array(JiraIssueSummarySchema).describe("List of simplified Jira issues"),
});

export type JiraSearchOutput = z.infer<typeof JiraSearchOutputSchema>;
