import { z } from "zod";

export const GoogleChatListSpacesSchema = z.object({
  pageSize: z.number().int().min(1).max(100).optional().default(10),
  pageToken: z.string().optional(),
});

export type GoogleChatListSpacesInput = z.infer<typeof GoogleChatListSpacesSchema>;
