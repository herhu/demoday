// Drop-in patched route (recommended)
import type { FastifyInstance } from "fastify";
import type { GoogleChatEvent } from "./types.js";
import { orchestrator } from "../../orchestration/orchestrator.js";
import { config } from "../../config/env.js";
import { generateCorrelationId } from "../../observability/correlation.js";
import { sanitizeUserText } from "../../security/sanitization.js";
import { formatter } from "../../orchestration/formatter.js";

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
    // Robust check for ADDED_TO_SPACE: it's an event type, but NOT a message event.
    const isAdded = event.type === 'ADDED_TO_SPACE' && !isMessage;

    // Handle app being added (simple check for now)
    if (isAdded) {
      const helpText = formatter.formatHelp();
      return reply
        .code(200)
        .header("content-type", "application/json")
        .send({
          actionResponse: { type: "NEW_MESSAGE" },
          text: `Thanks for adding me! Here is what I can do:\n\n${helpText}`
        });
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

      // Async Reply Pattern:
      // Instead of relying on the synchronous HTTP response (which is flaky), 
      // we use the Google Chat API to post a new message to the thread.
      try {
        const { googleChatClient } = await import("./client.js");
        await googleChatClient.sendMessage(msg.space?.name ?? "", responseText, msg.thread?.name);
        server.log.info({ correlationId }, "async response sent via chat api");
      } catch (err) {
        server.log.error({ correlationId, err }, "failed to send async response");
        // Fallback: try synchronous return if async fails? 
        // No, mixed signals confuse the platform. Stick to one strategy.
      }

      return reply
        .code(200)
        .header("content-type", "application/json")
        .send({}); // Ack the event
    }

    // IMPORTANT: never return {} — return a valid message (or at least an ack)
    return reply
      .code(200)
      .header("content-type", "application/json")
      .send({ actionResponse: { type: "NEW_MESSAGE" }, text: "OK" });
  });
}
