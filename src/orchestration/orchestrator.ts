import { aiIntentParser } from './aiIntent.js';
import { pipeline } from './pipeline.js';
import { policy } from './policy.js';
import { formatter } from './formatter.js';
import { auditLogger } from '../observability/audit.js';
import { validate } from '../utils/validate.js';
import { CircuitBreaker } from '../utils/circuitBreaker.js';
import { toPublicMessage } from '../utils/errors.js';
import type { SimplifiedJiraIssue, SimplifiedJiraProject } from '../integrations/jira/types.js';

import { JiraSearchSchema } from '../mcp/schemas/jiraSearch.schema.js';
import { JiraGetIssueSchema } from '../mcp/schemas/jiraGetIssue.schema.js';
import { JiraListProjectsSchema } from '../mcp/schemas/jiraListProjects.schema.js';
import { JiraCreateIssueSchema } from '../mcp/schemas/jiraCreateIssue.schema.js';
import { JiraAssignIssueSchema } from '../mcp/schemas/jiraAssignIssue.schema.js';
import { JiraAddWorklogSchema } from '../mcp/schemas/jiraAddWorklog.schema.js';

import { jiraSearchTool } from '../mcp/tools/jiraSearch.js';
import { jiraGetIssueTool } from '../mcp/tools/jiraGetIssue.js';
import { jiraListProjectsTool } from '../mcp/tools/jiraListProjects.js';
import { jiraCreateIssueTool } from '../mcp/tools/jiraCreateIssue.js';
import { jiraAssignIssueTool } from '../mcp/tools/jiraAssignIssue.js';
import { jiraAddWorklogTool } from '../mcp/tools/jiraAddWorklog.js';

const jiraCircuit = new CircuitBreaker('jiraApi');

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
      // 1. Foundation: Policy check
      policy.assertAllowedSource(source, correlationId);

      // 2. Foundation: Security and Token Window Sequential Data Quality Pipeline
      pipeline.validateLengthAndTokens(text, correlationId);
      pipeline.validateContentQuality(text, correlationId);

      // 3. Foundation: AI Enrichment and Extraction
      const intent = await aiIntentParser.parse(text, correlationId);

      if (intent.kind === 'UNKNOWN' || intent.kind === 'HELP') {
        return formatter.formatHelp();
      }

      // 4. Execution Pipeline (with Schema Validations acting as Contexts and Circuit Breakers for execution)
      let result;
      if (intent.kind === 'JIRA_SEARCH') {
        policy.assertAllowedTool('jira.searchIssues', correlationId);

        const args = validate(JiraSearchSchema, {
          jql: intent.parameters?.jql,
          correlationId
        }, correlationId);

        auditLogger.log({ correlationId, source: 'orchestrator', event: 'tool.call', details: { tool: 'jira.searchIssues', args } });

        const response = await jiraCircuit.execute(() => jiraSearchTool.handler(args));
        const issues = (response.structuredContent as { issues: SimplifiedJiraIssue[] }).issues;
        result = formatter.formatJiraList(issues);

      } else if (intent.kind === 'JIRA_GET') {
        policy.assertAllowedTool('jira.getIssue', correlationId);

        const args = validate(JiraGetIssueSchema, {
          issueKey: intent.parameters?.issueKey,
          correlationId
        }, correlationId);

        auditLogger.log({ correlationId, source: 'orchestrator', event: 'tool.call', details: { tool: 'jira.getIssue', args } });

        const response = await jiraCircuit.execute(() => jiraGetIssueTool.handler(args));
        const issue = response.structuredContent as SimplifiedJiraIssue;
        result = formatter.formatJiraIssue({
          key: issue.key, summary: issue.summary, status: issue.status,
          priority: issue.priority, assignee: issue.assignee, description: issue.description
        });
      } else if (intent.kind === 'JIRA_LIST_PROJECTS') {
        policy.assertAllowedTool('jira.listProjects', correlationId);

        const args = validate(JiraListProjectsSchema, { correlationId }, correlationId);
        auditLogger.log({ correlationId, source: 'orchestrator', event: 'tool.call', details: { tool: 'jira.listProjects', args } });

        const response = await jiraCircuit.execute(() => jiraListProjectsTool.handler(args));
        const projects = (response.structuredContent as { projects: SimplifiedJiraProject[] }).projects;
        result = formatter.formatProjectList(projects);

      } else if (intent.kind === 'JIRA_CREATE_ISSUE') {
        policy.assertAllowedTool('jira.createIssue', correlationId);

        const args = validate(JiraCreateIssueSchema, {
          projectKey: intent.parameters?.projectKey,
          summary: intent.parameters?.summary,
          issueType: intent.parameters?.issueType,
          correlationId
        }, correlationId);

        auditLogger.log({ correlationId, source: 'orchestrator', event: 'tool.call', details: { tool: 'jira.createIssue', args } });

        const response = await jiraCircuit.execute(() => jiraCreateIssueTool.handler(args));
        result = response?.content?.[0]?.text;

      } else if (intent.kind === 'JIRA_ASSIGN_ISSUE') {
        policy.assertAllowedTool('jira.assignIssue', correlationId);

        const args = validate(JiraAssignIssueSchema, {
          issueKey: intent.parameters?.issueKey,
          assigneeId: intent.parameters?.assigneeId,
          correlationId
        }, correlationId);

        auditLogger.log({ correlationId, source: 'orchestrator', event: 'tool.call', details: { tool: 'jira.assignIssue', args } });

        const response = await jiraCircuit.execute(() => jiraAssignIssueTool.handler(args));
        result = response?.content?.[0]?.text;

      } else if (intent.kind === 'JIRA_ADD_WORKLOG') {
        policy.assertAllowedTool('jira.addWorklog', correlationId);

        const args = validate(JiraAddWorklogSchema, {
          issueKey: intent.parameters?.issueKey,
          timeSpent: intent.parameters?.timeSpent,
          correlationId
        }, correlationId);

        auditLogger.log({ correlationId, source: 'orchestrator', event: 'tool.call', details: { tool: 'jira.addWorklog', args } });

        const response = await jiraCircuit.execute(() => jiraAddWorklogTool.handler(args));
        result = response?.content?.[0]?.text;
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
