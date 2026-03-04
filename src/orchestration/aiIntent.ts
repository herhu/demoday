import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { auditLogger } from '../observability/audit.js';
import { UpstreamError } from '../utils/errors.js';

// Requires GEMINI_API_KEY in process.env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type IntentKind = 'JIRA_SEARCH' | 'JIRA_GET' | 'JIRA_LIST_PROJECTS' | 'JIRA_CREATE_ISSUE' | 'JIRA_ASSIGN_ISSUE' | 'JIRA_ADD_WORKLOG' | 'HELP' | 'UNKNOWN';

export interface AIIntent {
    kind: IntentKind;
    parameters?: Record<string, any>;
    rawCommand: string;
}

// Export or use it if needed in the future, for now removed if unused, but we can keep it as documentation.
export const IntentExtractionSchema = z.object({
    kind: z.enum(['JIRA_SEARCH', 'JIRA_GET', 'JIRA_LIST_PROJECTS', 'JIRA_CREATE_ISSUE', 'JIRA_ASSIGN_ISSUE', 'JIRA_ADD_WORKLOG', 'HELP', 'UNKNOWN']),
    parameters: z.record(z.any()).optional().describe("Varies according to intent. e.g. for JQL search use `jql`, for getting issue use `issueKey`. For creating, `summary`, `projectKey`, `issueType`. For assigning, `issueKey`, `assigneeId`. For worklog, `issueKey`, `timeSpent` (e.g. '1h')."),
    confidence: z.number().min(0).max(1).describe("Confidence score of this classification")
});

export class AIIntentParser {
    async parse(text: string, correlationId: string): Promise<AIIntent> {
        auditLogger.log({ correlationId, source: 'aiIntent', event: 'parsing_intent', details: { textLength: text.length } });

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { role: 'user', parts: [{ text: `Extract the intent and parameters from this user request regarding Jira operations. The user says: "${text}"` }] }
                ],
                config: {
                    systemInstruction: "You are an intelligent Jira intent extraction model. Your goal is to map the user's natural language into exact structured intents. If the user asks to search or list issues based on arbitrary criteria (like 'tickets of the current month', 'my open bugs', 'high priority issues'), you MUST output JIRA_SEARCH and you MUST generate a valid Jira Query Language (JQL) string in the `parameters.jql` field to fulfill their request. For example, for 'tickets of the current month', generate `created >= startOfMonth()`. If the user wants to log time, output JIRA_ADD_WORKLOG. If they want to create a task, output JIRA_CREATE_ISSUE. If assigning, JIRA_ASSIGN_ISSUE. If they are asking for help or greetings, output HELP. Please be as precise as possible extracting parameters. JIRA_ADD_WORKLOG needs issueKey and timeSpent. JIRA_CREATE_ISSUE needs projectKey, summary, and optionally issueType (default 'Task').",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            kind: { type: "STRING", enum: ['JIRA_SEARCH', 'JIRA_GET', 'JIRA_LIST_PROJECTS', 'JIRA_CREATE_ISSUE', 'JIRA_ASSIGN_ISSUE', 'JIRA_ADD_WORKLOG', 'HELP', 'UNKNOWN'] },
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    jql: { type: "STRING" },
                                    issueKey: { type: "STRING" },
                                    projectKey: { type: "STRING" },
                                    summary: { type: "STRING" },
                                    issueType: { type: "STRING" },
                                    assigneeId: { type: "STRING" },
                                    timeSpent: { type: "STRING" }
                                }
                            },
                            confidence: { type: "NUMBER" }
                        },
                        required: ["kind", "confidence"]
                    }
                }
            });

            const rawJson = response.text;
            console.log(`[DEBUG Gemini Raw Output]:`, rawJson);
            if (!rawJson) {
                return { kind: 'UNKNOWN', rawCommand: text };
            }

            const parsed = JSON.parse(rawJson);

            // Strict matching just in case
            if (parsed.confidence < 0.6) {
                return { kind: 'UNKNOWN', rawCommand: text };
            }

            return {
                kind: parsed.kind,
                parameters: parsed.parameters,
                rawCommand: text
            };

        } catch (e: any) {
            auditLogger.log({ correlationId, source: 'aiIntent', event: 'parse_error', error: e.message });
            throw new UpstreamError("Failed to parse intent using AI.", correlationId, { cause: e.message });
        }
    }
}

export const aiIntentParser = new AIIntentParser();
