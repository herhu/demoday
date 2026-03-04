import { z } from "zod";

export const JiraAddWorklogSchema = z.object({
    issueKey: z.string().trim().min(1, "Issue key is required"),
    timeSpent: z.string().trim().min(1, "Time spent is required (e.g. '1h 30m')"),
    correlationId: z.string().trim().optional()
});

export type JiraAddWorklogInput = z.infer<typeof JiraAddWorklogSchema>;
