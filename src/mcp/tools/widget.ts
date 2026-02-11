import { z } from "zod";
import { config } from "../../config/env.js";

export const widgetTool = {
  name: "show_widget",
  description: "Displays a dashboard widget in the chat interface.",
  schema: z.object({}),
  outputSchema: z.object({
    _meta: z.object({
      ui: z.object({
        resourceUri: z.string(),
      }),
    }),
    content: z.array(
      z.object({
        type: z.literal("text"),
        text: z.string(),
      })
    ),
  }),
  handler: async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: "Here is the widget you requested.",
        },
      ],
      _meta: {
        ui: {
          resourceUri: `${config.MCP_BASE_URL || "http://localhost:3000"}/index.html`,
        },
      },
    };
  },
};
