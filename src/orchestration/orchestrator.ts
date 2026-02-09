import { intentParser } from './intent.js';
import { policy } from './policy.js';
import { formatter } from './formatter.js';
import { auditLogger } from '../observability/audit.js';
import { jiraSearchTool } from '../mcp/tools/jiraSearch.js';
import { jiraGetIssueTool } from '../mcp/tools/jiraGetIssue.js';
import { validate } from '../utils/validate.js';
import { JiraSearchSchema } from '../mcp/schemas/jiraSearch.schema.js';
import { JiraGetIssueSchema } from '../mcp/schemas/jiraGetIssue.schema.js';
import { toPublicMessage } from '../utils/errors.js';

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
      policy.assertAllowedSource(source);
      policy.assertWithinLimits(text);

      // 2. Intent
      const intent = intentParser.parse(text);
      if (intent.kind === 'UNKNOWN' || intent.kind === 'HELP') {
        return formatter.formatHelp();
      }

      // 3. Execution (Deterministic Plan)
      let result;
      if (intent.kind === 'JIRA_SEARCH') {
        policy.assertAllowedTool('jira_search_issues');
        
        // Validate arguments
        const args = validate(JiraSearchSchema, { 
            jql: intent.parameters?.jql, 
            maxResults: 10 
        }, correlationId);

        auditLogger.log({ correlationId, source, event: 'tool.call', details: { tool: 'jira_search_issues', args } });
        
        const mcpResult = await jiraSearchTool.handler(args);
        if (!mcpResult.content[0] || !('text' in mcpResult.content[0])) {
             throw new Error('Invalid tool output');
        }
        const issues = JSON.parse(mcpResult.content[0].text);
        result = formatter.formatJiraList(issues);

      } else if (intent.kind === 'JIRA_GET') {
         policy.assertAllowedTool('jira_get_issue');
         
         const args = validate(JiraGetIssueSchema, {
             issueKey: intent.parameters?.issueKey
         }, correlationId);

         auditLogger.log({ correlationId, source, event: 'tool.call', details: { tool: 'jira_get_issue', args } });
         
         const mcpResult = await jiraGetIssueTool.handler(args);
         
         if (!mcpResult.content[0] || !('text' in mcpResult.content[0])) {
             throw new Error('Invalid tool output');
         }

         const issue = JSON.parse(mcpResult.content[0].text);
         result = formatter.formatJiraIssue({
             key: issue.key,
             summary: issue.summary,
             status: issue.status,
             priority: issue.priority,
             assignee: issue.assignee,
             description: issue.description
         });
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
