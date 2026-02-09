
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// We might need a custom transport or use the SSEServerTransport with an adapter if the SDK supports it.
// The instructions say "Streamable HTTP endpoint". 
// The SDK has SSEServerTransport.
// However, the prompt says "POST/GET /mcp".
// The standard MCP over HTTP uses SSE for events and POST for requests.
// Let's implement the server instance first.

import { jiraSearchTool } from './tools/jiraSearch.js';
import { jiraGetIssueTool } from './tools/jiraGetIssue.js';

// Create one server instance
export const mcpServer = new McpServer({
  name: 'Demo MCP Server',
  version: '1.0.0',
});

// Register tools
mcpServer.registerTool(
  jiraSearchTool.name,
  {
    description: jiraSearchTool.description,
    inputSchema: jiraSearchTool.schema.shape,
  },
  jiraSearchTool.handler
);

mcpServer.registerTool(
  jiraGetIssueTool.name,
  {
    description: jiraGetIssueTool.description,
    inputSchema: jiraGetIssueTool.schema.shape,
  },
  jiraGetIssueTool.handler
);
