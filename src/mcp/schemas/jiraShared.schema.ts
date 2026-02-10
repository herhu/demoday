import { z } from "zod";

export const JiraIssueSummarySchema = z.object({
  key: z
    .string()
    .describe("Jira issue key (e.g., PROJ-123)"),

  summary: z
    .string()
    .describe("Short summary/title of the issue"),

  status: z
    .string()
    .describe("Current workflow status of the issue"),

  priority: z
    .string()
    .optional()
    .describe("Issue priority (if set)"),

  assignee: z
    .string()
    .optional()
    .describe("Display name of the assignee (if any)"),
});

export type JiraIssueSummary = z.infer<typeof JiraIssueSummarySchema>;
