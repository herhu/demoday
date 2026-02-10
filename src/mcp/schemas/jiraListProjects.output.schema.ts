import { z } from "zod";

export const JiraListProjectsOutputSchema = z.object({
  projects: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
    })
  ),
});
