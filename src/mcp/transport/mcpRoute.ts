import type { FastifyInstance } from 'fastify';
import { createMcpHttpBridge } from './nodeBridge.js';
import { mcpServer } from '../server.js';

export async function mcpRoute(server: FastifyInstance) {
  // Create the bridge once (the bridge factory awaits connection)
  const bridge = await createMcpHttpBridge(mcpServer);

  server.all('/mcp', async (req, reply) => {
    // Hijack the response to allow the transport to handle writing to the raw socket
    reply.hijack();

    // Delegate to the bridge
    // The bridge wrapper handles error catching and closure
    await bridge.handle(req.raw, reply.raw);
  });
}
