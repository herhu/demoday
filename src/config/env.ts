import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  JIRA_BASE_URL: z.string().url(),
  JIRA_EMAIL: z.string().email(),
  JIRA_API_TOKEN: z.string().min(1),
  JIRA_DEFAULT_PROJECT: z.string().optional(),
  GOOGLE_CHAT_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  GOOGLE_CHAT_API_TOKEN: z.string().optional(),
  MCP_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2),
  );
  process.exit(1);
}

export const config = parsed.data;
