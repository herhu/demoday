import { z } from "zod";

export const GoogleChatListSpacesOutputSchema = z.object({
  spaces: z.array(
    z.object({
      name: z.string(),
      displayName: z.string().optional(),
      type: z.string().optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

export type GoogleChatListSpacesOutput = z.infer<typeof GoogleChatListSpacesOutputSchema>;
