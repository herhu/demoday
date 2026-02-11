import Fastify from "fastify";
import { config } from "./config/env.js";
import { googleChatWebhookRoute } from "./integrations/googleChat/webhookRoute.js";
import { mcpRoute } from "./mcp/transport/mcpRoute.js";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const server = Fastify({
  logger: { level: config.LOG_LEVEL },
});


server.register(googleChatWebhookRoute);
server.register(mcpRoute);

server.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
  prefix: "/", // optional: default '/'
});


server.get("/health", async () => ({ status: "ok" }));

async function start() {
  try {
    await server.listen({ port: config.PORT, host: "0.0.0.0" });
    server.log.info(`Server listening on ${config.PORT}`);
    server.log.info(`MCP Base URL: ${config.MCP_BASE_URL || "http://localhost:" + config.PORT}`);

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
