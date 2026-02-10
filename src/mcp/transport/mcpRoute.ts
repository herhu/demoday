import type { FastifyInstance } from 'fastify';
import { createMcpHttpBridge } from './nodeBridge.js';
import { mcpServer } from '../server.js';

export async function mcpRoute(server: FastifyInstance) {
  // Create the bridge once (the bridge factory awaits connection)
  const bridge = await createMcpHttpBridge(mcpServer);

  // Use a child scope to override content type parsing for /mcp
  server.register(async (mcpScope) => {
    // Override application/json to prevent Fastify from consuming the body
    mcpScope.addContentTypeParser('application/json', (_req, _payload, done) => {
      // payload is the raw stream; pass it through unconsumed?
      // Actually, passing `undefined` or skipping consumption keeps req.raw intact?
      // SDK uses req.raw (IncomingMessage). Fastify wraps payload.
      // If we call done(null, payload), req.body becomes payload (stream).
      // This prevents JSON.parse() and allows the transport to read the stream itself if logic permits,
      // but StreamableHTTPServerTransport reads from `req` (IncomingMessage).
      // The payload stream is piped from req.
      
      // Let's rely on Fastify not draining the original req if we don't consume payload here.
      done(null, {}); 
    });

    mcpScope.all('/mcp', async (req, reply) => {
        // Hijack the response to allow the transport to handle writing to the raw socket
        reply.hijack();

        // Delegate to the bridge
        // The bridge wrapper handles error catching and closure
        await bridge.handle(req.raw, reply.raw);
    });
  });
}
