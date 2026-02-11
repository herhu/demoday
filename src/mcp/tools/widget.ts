import { z } from "zod";
import { config } from "../../config/env.js";
import fs from "node:fs/promises";
import path from "node:path";

export const widgetTool = {
  name: "show_widget",
  description: "Displays a dashboard widget in the chat interface.",
  schema: z.object({}),
  handler: async () => {
    let dashboardContent = "Dashboard content unavailable.";
    try {
      const dashboardPath = path.join(process.cwd(), "public", "dashboard.md");
      dashboardContent = await fs.readFile(dashboardPath, "utf-8");
    } catch (err) {
      console.error("Error reading dashboard.md:", err);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: dashboardContent,
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
