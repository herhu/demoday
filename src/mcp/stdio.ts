import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { mcpServer } from "./server.js";


async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error in MCP stdio server:", err);
  process.exit(1);
});
