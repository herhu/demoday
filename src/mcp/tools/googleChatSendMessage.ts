import { GoogleChatSendMessageSchema } from "../schemas/googleChatSendMessage.schema.js";
import { GoogleChatSendMessageOutputSchema } from "../schemas/googleChatSendMessage.output.schema.js";
import { googleChatClient } from "../../integrations/googleChat/client.js";

export const googleChatSendMessageTool = {
  name: "googleChat_sendMessage",
  description: "Send a message to a Google Chat space",
  schema: GoogleChatSendMessageSchema,
  outputSchema: GoogleChatSendMessageOutputSchema,
  handler: async (args: unknown) => {
    const { spaceName, text, threadKey } = GoogleChatSendMessageSchema.parse(args);
    await googleChatClient.sendMessage(spaceName, text, threadKey);

    return {
      structuredContent: {
        name: spaceName,
        text,
        thread: threadKey ? { name: threadKey } : undefined,
      },
      content: [
        {
          type: "text" as const,
          text: `Message sent to ${spaceName}`,
        },
      ],
    };
  },
};
