
import Fastify from "fastify";
import { config } from "./config/env.js";
import { McpHttpClient } from "./mcp/client.js";
import { googleChatWebhookRoute } from "./integrations/googleChat/webhookRoute.js";
import { mcpRoute } from "./mcp/transport/mcpRoute.js";

const server = Fastify({
  logger: { level: config.LOG_LEVEL },
});

// Create MCP client AFTER env/config is loaded
export const mcpClient = new McpHttpClient(
  config.MCP_BASE_URL ?? `http://localhost:${config.PORT}`
);

server.register(googleChatWebhookRoute);
server.register(mcpRoute);

server.get("/health", async () => ({ status: "ok" }));

async function start() {
  try {
    await server.listen({ port: config.PORT, host: "0.0.0.0" });
    server.log.info(`Server listening on ${config.PORT}`);
    
    // Optional: Warm up MCP client connection
    // await mcpClient.ensureConnected(); // Private method, skip for now or expose if needed
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
