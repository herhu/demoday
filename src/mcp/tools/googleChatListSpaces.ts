import { GoogleChatListSpacesSchema } from "../schemas/googleChatListSpaces.schema.js";
import { GoogleChatListSpacesOutputSchema } from "../schemas/googleChatListSpaces.output.schema.js";
import { googleChatClient } from "../../integrations/googleChat/client.js";

export const googleChatListSpacesTool = {
  name: "googleChat_listSpaces",
  description: "List available Google Chat spaces",
  schema: GoogleChatListSpacesSchema,
  outputSchema: GoogleChatListSpacesOutputSchema,
  handler: async (args: unknown) => {
    const { pageSize, pageToken } = GoogleChatListSpacesSchema.parse(args);
    const response = await googleChatClient.listSpaces(pageSize, pageToken);

    const simplified = response.spaces?.map((space) => ({
      name: space.name ?? "unknown",
      displayName: space.displayName ?? "unknown",
      type: space.type ?? "unknown",
    })) ?? [];

    return {
      structuredContent: {
        spaces: simplified,
        nextPageToken: response.nextPageToken ?? undefined,
      },
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(simplified, null, 2),
        },
      ],
    };
  },
};
