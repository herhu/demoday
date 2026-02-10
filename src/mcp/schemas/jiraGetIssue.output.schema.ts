import { z } from "zod";

export const JiraGetIssueOutputSchema = z.object({
  key: z.string(),
  summary: z.string(),
  description: z.string().optional().or(z.object({})).or(z.array(z.any())).optional(), // Relaxed for rich text or string
  status: z.string(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
});

export type JiraGetIssueOutput = z.infer<typeof JiraGetIssueOutputSchema>;
