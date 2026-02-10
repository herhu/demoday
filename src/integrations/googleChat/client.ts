import { chat_v1, google } from "googleapis";


export class GoogleChatClient {
  private chat: chat_v1.Chat;

  constructor() {
    // Rely on Application Default Credentials (ADC) or GOOGLE_APPLICATION_CREDENTIALS
    // behaving correctly in the environment.
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/chat.bot"],
    });

    this.chat = google.chat({
      version: "v1",
      auth,
    });
  }

  async sendMessage(spaceName: string, text: string, threadName?: string): Promise<void> {
    const request: chat_v1.Params$Resource$Spaces$Messages$Create = {
      parent: spaceName,
      requestBody: {
        text,
      },
    };

    if (threadName) {
      request.requestBody!.thread = { name: threadName };
    }

    try {
      await this.chat.spaces.messages.create(request);
    } catch (error) {
      console.error("Failed to send async Google Chat message:", error);
      // We don't throw here to avoid crashing the webhook handler if this is a secondary mechanism
      throw error;
    }
  }
}

export const googleChatClient = new GoogleChatClient();
