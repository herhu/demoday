// Drop-in patched route (recommended)
import type { FastifyInstance } from "fastify";
import type { GoogleChatEvent } from "./types.js";
import { orchestrator } from "../../orchestration/orchestrator.js";
import { config } from "../../config/env.js";
import { generateCorrelationId } from "../../observability/correlation.js";
import { sanitizeUserText } from "../../security/sanitization.js";

export async function googleChatWebhookRoute(server: FastifyInstance) {
  server.post<{ Body: GoogleChatEvent }>("/google-chat/webhook", async (request, reply) => {
    const correlationId = generateCorrelationId();
    const event = request.body;

    // TEMP logging (highly recommended until you see replies)
    server.log.info({ correlationId, eventType: event?.type, body: event }, "google chat inbound");

    // Optional verification
    if (config.GOOGLE_CHAT_WEBHOOK_VERIFY_TOKEN) {
      // Implement token verification later; for now don't block.
    }


    // Normalize payload: Chat Apps wrap everything in `chat` and `messagePayload`
    // Legacy/Curl might look like flat structure.
    const messagePayload = event.chat?.messagePayload ?? event;
    const isMessage = !!messagePayload.message;
    const isAdded = event.chat?.space ? false : (event.type === 'ADDED_TO_SPACE'); // Simplified check

    // Handle app being added (simple check for now)
    if (isAdded) {
      return reply
        .code(200)
        .header("content-type", "application/json")
        .send({ text: 'Thanks for adding me! Try: "/jira get NJS-6766" or "/jira search project = NJS"' });
    }

    // Handle messages
    if (isMessage) {
      const msg = messagePayload.message;
      const senderName = msg.sender?.name ?? "unknown";
      const senderEmail = msg.sender?.email ?? undefined;
      const spaceName = msg.space?.name ?? "unknown-space";

      // argumentText is usually populated for @mentions and slash commands
      let text = msg.argumentText || msg.text || "";
      text = sanitizeUserText(text).trim();

      // If user @mentions bot, message.text often contains mention; argumentText may be empty.
      // For demo, normalize: if it doesn't start with /jira, prepend it.
      if (text && !text.startsWith("/jira")) {
        text = `/jira ${text}`;
      }

      const responseText = await orchestrator.handleChatCommand(
        correlationId,
        "google-chat",
        senderEmail || senderName,
        spaceName,
        text
      );

      server.log.info({ correlationId, responseText }, "google chat reply text");

      // DEBUG: Simplify response to bare minimum to isolate "silent failure" cause
      // Removing threading temporarily.
      const response = { 
        text: responseText 
      };

      server.log.info({ correlationId, outbound: response }, "sending response to chat");

      return reply
        .code(200)
        .header("content-type", "application/json")
        .send(response);
    }

    // IMPORTANT: never return {} — return a valid message (or at least an ack)
    return reply
      .code(200)
      .header("content-type", "application/json")
      .send({ text: "OK" });
  });
}
