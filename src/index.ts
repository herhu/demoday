import { McpHttpClient } from './mcp/client.js';

export const mcpClient = new McpHttpClient(process.env.MCP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`);

import Fastify from 'fastify';
import { config } from './config/env.js';

import { googleChatWebhookRoute } from './integrations/googleChat/webhookRoute.js';

const server = Fastify({
  logger: {
    level: config.LOG_LEVEL,
  },
});

import { mcpRoute } from './mcp/transport/mcpRoute.js';
server.register(googleChatWebhookRoute);
server.register(mcpRoute);

server.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
