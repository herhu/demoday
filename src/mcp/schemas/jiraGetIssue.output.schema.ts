import { z } from "zod";

export const JiraGetIssueOutputSchema = z.object({
  key: z.string(),
  summary: z.string(),
  description: z.string().optional().or(z.object({})).or(z.array(z.any())).nullable().optional(), // Relaxed for rich text or string, nullable for empty
  status: z.string(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
});

export type JiraGetIssueOutput = z.infer<typeof JiraGetIssueOutputSchema>;
