import type { FastifyInstance } from 'fastify';
import { createMcpHttpBridge } from './nodeBridge.js';
import { mcpServer } from '../server.js';

export async function mcpRoute(server: FastifyInstance) {
  const bridge = createMcpHttpBridge(mcpServer);

  // Handle GET (SSE) and POST (JSON-RPC) requests via the bridge
  server.get('/mcp', async (req, reply) => {
    reply.hijack();
    await bridge.handle(req.raw, reply.raw);
  });

  server.post('/mcp', async (req, reply) => {
    reply.hijack();
    await bridge.handle(req.raw, reply.raw);
  });
}
