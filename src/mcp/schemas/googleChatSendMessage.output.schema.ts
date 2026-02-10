import { z } from "zod";

export const GoogleChatSendMessageOutputSchema = z.object({
  name: z.string(),
  text: z.string().optional(),
  thread: z.object({ name: z.string().optional() }).optional(),
});

export type GoogleChatSendMessageOutput = z.infer<typeof GoogleChatSendMessageOutputSchema>;
