import { z } from "zod";

export const JiraAssignIssueSchema = z.object({
    issueKey: z.string().trim().min(1, "Issue key is required"),
    assigneeId: z.string().trim().min(1, "Assignee ID is required"),
    correlationId: z.string().trim().optional()
});

export type JiraAssignIssueInput = z.infer<typeof JiraAssignIssueSchema>;
