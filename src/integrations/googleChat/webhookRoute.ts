import type { FastifyInstance } from 'fastify';
import type { GoogleChatEvent } from './types.js';
import { orchestrator } from '../../orchestration/orchestrator.js';
import { config } from '../../config/env.js';
import { generateCorrelationId } from '../../observability/correlation.js';
import { sanitizeUserText } from '../../security/sanitization.js';

export async function googleChatWebhookRoute(server: FastifyInstance) {
  server.post<{ Body: GoogleChatEvent }>('/google-chat/webhook', async (request) => {
    const correlationId = generateCorrelationId();
    const event = request.body;
    
    // Verification (Optional but recommended)
    if (config.GOOGLE_CHAT_WEBHOOK_VERIFY_TOKEN) {
      // Basic token verification if provided in headers or body
    }

    if (event.type === 'ADDED_TO_SPACE') {
      return { text: 'Thanks for adding me! I can help you with Jira. Try "/jira help".' };
    }

    if (event.type === 'MESSAGE' && event.message) {
      const { name, email } = event.message.sender;
      const { name: spaceName } = event.space;
      let text = event.message.argumentText || event.message.text || ''; // argumentText is cleaner for slash commands
      
      text = sanitizeUserText(text);

      // Clean text: remove bot mention if argumentText is not populated
      const cleanedText = text?.trim() ?? '';

      const responseText = await orchestrator.handleChatCommand(
        correlationId,
        'google-chat',
        email || name, // Use email as preferred ID
        spaceName,
        cleanedText
      );

      // Return direct response
      return { text: responseText };
    }

    return {};
  });
}
