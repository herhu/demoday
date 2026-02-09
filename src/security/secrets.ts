
import { config } from '../config/env.js';

export function getSecrets() {
  return {
    jiraBaseUrl: config.JIRA_BASE_URL,
    jiraEmail: config.JIRA_EMAIL,
    jiraApiToken: config.JIRA_API_TOKEN,
    googleChatVerifyToken: config.GOOGLE_CHAT_WEBHOOK_VERIFY_TOKEN,
  };
}

export function redactSecrets(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSecrets);
  }

  const secrets = getSecrets();
  const secretValues = Object.values(secrets).filter((v): v is string => !!v);

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      redacted[key] = redactSecrets(value);
      continue;
    }

    if (typeof value === 'string') {
        let safeValue = value;
        for (const secret of secretValues) {
            if (safeValue.includes(secret)) {
                safeValue = safeValue.replaceAll(secret, '***');
            }
        }
        redacted[key] = safeValue;
    } else {
        redacted[key] = value;
    }
  }

  return redacted;
}
