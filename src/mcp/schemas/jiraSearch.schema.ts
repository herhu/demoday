
import { z } from 'zod';

export const JiraSearchSchema = z.object({
  jql: z.string().describe('Jira Query Language string'),
  maxResults: z.number().optional().default(10).describe('Maximum number of results to return'),
});

export type JiraSearchInput = z.infer<typeof JiraSearchSchema>;
