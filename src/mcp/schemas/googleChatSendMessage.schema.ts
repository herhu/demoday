import { z } from "zod";

export const GoogleChatSendMessageSchema = z.object({
  spaceName: z.string().min(1, "Space name is required"),
  text: z.string().min(1, "Message text is required"),
  threadKey: z.string().optional(),
});

export type GoogleChatSendMessageInput = z.infer<typeof GoogleChatSendMessageSchema>;
