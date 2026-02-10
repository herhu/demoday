import { z } from "zod";

export const JiraGetIssueSchema = z.object({
  issueKey: z
    .string()
    .trim()
    .min(1, "issueKey is required")
    .regex(/^[A-Z][A-Z0-9]+-\d+$/, "Invalid Jira issue key format")
    .describe("The key of the Jira issue (e.g., PROJ-123)"),
  correlationId: z
    .string()
    .trim()
    .optional()
    .describe("Tracing ID for observability"),
});

export type JiraGetIssueInput = z.infer<typeof JiraGetIssueSchema>;
