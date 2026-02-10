import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { jiraSearchTool } from "./tools/jiraSearch.js";
import { jiraGetIssueTool } from "./tools/jiraGetIssue.js";
import { jiraListProjectsTool } from "./tools/jiraListProjects.js";

export const mcpServer = new McpServer({
  name: "Demo MCP Server",
  version: "1.0.0",
});

mcpServer.registerTool(
  jiraSearchTool.name,
  {
    description: jiraSearchTool.description,
    inputSchema: jiraSearchTool.schema,
    outputSchema: jiraSearchTool.outputSchema,
  },
  jiraSearchTool.handler
);

mcpServer.registerTool(
  jiraGetIssueTool.name,
  {
    description: jiraGetIssueTool.description,
    inputSchema: jiraGetIssueTool.schema,
    outputSchema: jiraGetIssueTool.outputSchema,
  },
  jiraGetIssueTool.handler
);

mcpServer.registerTool(
  jiraListProjectsTool.name,
  {
    description: jiraListProjectsTool.description,
    inputSchema: jiraListProjectsTool.schema,
    outputSchema: jiraListProjectsTool.outputSchema,
  },
  jiraListProjectsTool.handler
);
