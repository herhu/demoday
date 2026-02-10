
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { jiraSearchTool } from './tools/jiraSearch.js';
import { jiraGetIssueTool } from './tools/jiraGetIssue.js';

// Create one server instance
export const mcpServer = new McpServer({
  name: 'Demo MCP Server',
  version: '1.0.0',
});

// Register tools
mcpServer.registerTool(
  'jira.searchIssues',
  {
    description: jiraSearchTool.description,
    inputSchema: zodToJsonSchema(jiraSearchTool.schema as any) as any,
  },
  jiraSearchTool.handler
);

mcpServer.registerTool(
  'jira.getIssue',
  {
    description: jiraGetIssueTool.description,
    inputSchema: zodToJsonSchema(jiraGetIssueTool.schema as any) as any,
  },
  jiraGetIssueTool.handler
);
