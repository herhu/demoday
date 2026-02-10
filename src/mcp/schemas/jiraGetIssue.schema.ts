
import { z } from 'zod';

export const JiraGetIssueSchema = z.object({
  issueKey: z.string().describe('The key of the Jira issue (e.g., PROJ-123)'),
  correlationId: z.string().optional().describe('Tracing ID for observability'),
});

export type JiraGetIssueInput = z.infer<typeof JiraGetIssueSchema>;
