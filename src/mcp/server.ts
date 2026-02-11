import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { jiraSearchTool } from "./tools/jiraSearch.js";
import { jiraGetIssueTool } from "./tools/jiraGetIssue.js";
import { jiraListProjectsTool } from "./tools/jiraListProjects.js";
import { googleChatListSpacesTool } from "./tools/googleChatListSpaces.js";
import { googleChatSendMessageTool } from "./tools/googleChatSendMessage.js";
import { widgetTool } from "./tools/widget.js";



export const createMcpServer = () => {
    const server = new McpServer({
        name: "Demo MCP Server",
        version: "1.0.0",
      });

      server.registerTool(
        jiraSearchTool.name,
        {
          description: jiraSearchTool.description,
          inputSchema: jiraSearchTool.schema,
          outputSchema: jiraSearchTool.outputSchema,
        },
        jiraSearchTool.handler
      );
      
      server.registerTool(
        jiraGetIssueTool.name,
        {
          description: jiraGetIssueTool.description,
          inputSchema: jiraGetIssueTool.schema,
          outputSchema: jiraGetIssueTool.outputSchema,
        },
        jiraGetIssueTool.handler
      );
      
      server.registerTool(
        jiraListProjectsTool.name,
        {
          description: jiraListProjectsTool.description,
          inputSchema: jiraListProjectsTool.schema,
          outputSchema: jiraListProjectsTool.outputSchema,
        },
        jiraListProjectsTool.handler
      );

      server.registerTool(
        googleChatListSpacesTool.name,
        {
          description: googleChatListSpacesTool.description,
          inputSchema: googleChatListSpacesTool.schema,
          outputSchema: googleChatListSpacesTool.outputSchema,
        },
        googleChatListSpacesTool.handler
      );
      
      
      server.registerTool(
        googleChatSendMessageTool.name,
        {
          description: googleChatSendMessageTool.description,
          inputSchema: googleChatSendMessageTool.schema,
          outputSchema: googleChatSendMessageTool.outputSchema,
        },
        googleChatSendMessageTool.handler
      );

      server.registerTool(
        widgetTool.name,
        {
          description: widgetTool.description,
          inputSchema: widgetTool.schema,
          outputSchema: widgetTool.outputSchema,
        },
        widgetTool.handler
      );

      return server;
}

// Keep the singleton for now if used elsewhere, or deprecate it
export const mcpServer = createMcpServer();


