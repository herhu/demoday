
import { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Creates a bridge between Node.js HTTP (Fastify raw) and the MCP SDK transport.
 * 
 * Note: This returns a singleton-like handler structure, but for true singleton behavior
 * across HMR or multiple calls, the caller should maintain the instance.
 */
export async function createMcpHttpBridge(mcpServer: McpServer) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    // Enforce DNS rebinding protection if needed, though SDK defaults are usually improved.
  });

  // Await connection to ensure the server is ready before handling requests
  try {
    await mcpServer.connect(transport);
    console.log('MCP Server connected to Streamable HTTP transport');
  } catch (err) {
    console.error('Failed to connect MCP server to transport:', err);
    throw err; // Re-throw to fail startup if critical
  }

  return {
    async handle(req: IncomingMessage, res: ServerResponse) {
      try {
        await transport.handleRequest(req, res);
      } catch (err) {
        console.error('MCP Transport error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "MCP transport internal error" }));
        } else {
          res.end();
        }
      }
    },
  };
}
