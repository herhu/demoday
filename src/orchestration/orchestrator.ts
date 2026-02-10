import { intentParser } from './intent.js';
import { policy } from './policy.js';
import { formatter } from './formatter.js';
import { auditLogger } from '../observability/audit.js';
import { mcpClient } from '../index.js'; // Import the singleton client
import { validate } from '../utils/validate.js';
import { JiraSearchSchema } from '../mcp/schemas/jiraSearch.schema.js'; // Updated import path
import { JiraGetIssueSchema } from '../mcp/schemas/jiraGetIssue.schema.js'; // Updated import path
import { toPublicMessage } from '../utils/errors.js';
import type { SimplifiedJiraIssue } from '../integrations/jira/types.js'; // New import

export class Orchestrator {
  async handleChatCommand(
    correlationId: string,
    source: string,
    userId: string,
    roomId: string,
    text: string
  ): Promise<string> {
    
    auditLogger.log({ correlationId, source, event: 'ingress', userId, details: { roomId, text } });

    try {
      // 1. Policy
      policy.assertAllowedSource(source, correlationId);
      policy.assertWithinLimits(text, correlationId);

      // 2. Intent
      const intent = intentParser.parse(text);
      if (intent.kind === 'UNKNOWN' || intent.kind === 'HELP') {
        return formatter.formatHelp();
      }

      // 3. Execution (Deterministic Plan)
      let result;
      if (intent.kind === 'JIRA_SEARCH') {
        // 1. Policy check
        policy.assertAllowedTool('jira.searchIssues', correlationId);
        
        // 2. Validate args
        const args = validate(
          JiraSearchSchema,
          { 
            jql: intent.parameters?.jql, 
            maxResults: 10,
            correlationId // Pass correlationId to schema validation/object
          },
          correlationId
        );

        auditLogger.log({
          correlationId,
          source: 'orchestrator',
          event: 'tool.call',
          details: { tool: 'jira.searchIssues', args },
        });
        
        // 3. Execute via MCP Client
        const response = await mcpClient.callTool<typeof args, { issues: SimplifiedJiraIssue[] }>(
          correlationId,
          'jira.searchIssues',
          args
        );
        const issues = response.issues;

        // 4. Format
        result = formatter.formatJiraList(issues);

      } else if (intent.kind === 'JIRA_GET') {
        // 1. Policy check
        policy.assertAllowedTool('jira.getIssue', correlationId);
         
        // 2. Validate args
        const args = validate(
          JiraGetIssueSchema,
          { 
            issueKey: intent.parameters?.issueKey,
            correlationId 
          },
          correlationId
        );

        auditLogger.log({
          correlationId,
          source: 'orchestrator',
          event: 'tool.call',
          details: { tool: 'jira.getIssue', args },
        });
         
        // 3. Execute via MCP Client
        const issue = await mcpClient.callTool<typeof args, SimplifiedJiraIssue>(
          correlationId,
          'jira.getIssue',
          args
        );

        // 4. Format
        result = formatter.formatJiraIssue({
            key: issue.key,
            summary: issue.summary,
            status: issue.status,
            priority: issue.priority,
            assignee: issue.assignee,
            description: issue.description
        });
      } else {
        result = "I'm sorry, I don't know how to handle that request.";
      }

      auditLogger.log({ correlationId, source, event: 'egress', details: { result } });
      return result || 'No result produced.';

    } catch (error: any) {
      auditLogger.log({ correlationId, source, event: 'tool.err', error: error.message });
      
      // Inject correlation ID if missing from error
      if (error && typeof error === 'object' && !error.correlationId) {
          error.correlationId = correlationId;
      }
      
      return toPublicMessage(error);
    }
  }
}

export const orchestrator = new Orchestrator();
