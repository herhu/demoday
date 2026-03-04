import { z } from "zod";

export const JiraCreateIssueSchema = z.object({
    projectKey: z.string().trim().min(1, "Project key is required"),
    summary: z.string().trim().min(1, "Summary is required"),
    issueType: z.string().trim().optional().default("Task"),
    correlationId: z.string().trim().optional()
});

export type JiraCreateIssueInput = z.infer<typeof JiraCreateIssueSchema>;
