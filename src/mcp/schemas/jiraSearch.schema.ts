import { z } from "zod";

export const JiraSearchSchema = z.object({
  jql: z
    .string()
    .trim()
    .min(1, "jql is required")
    .describe("Jira Query Language string"),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe("Maximum number of results to return (1–50)"),
  correlationId: z
    .string()
    .trim()
    .optional()
    .describe("Tracing ID for observability"),
});

export type JiraSearchInput = z.infer<typeof JiraSearchSchema>;
