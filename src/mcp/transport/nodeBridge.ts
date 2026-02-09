
import { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Creates a bridge between Node.js HTTP (Fastify raw) and the MCP SDK transport.
 */
export function createMcpHttpBridge(mcpServer: McpServer) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  // Connect the server to the transport
  // Note: We don't await this here to keep the factory synchronous,
  // but in a real app you might want to await initialization.
  // Ideally, call this once at startup.
  mcpServer.connect(transport).catch((err) => {
    console.error('Failed to connect MCP server to transport:', err);
  });

  return {
    async handle(req: IncomingMessage, res: ServerResponse) {
      await transport.handleRequest(req, res);
    },
  };
}
