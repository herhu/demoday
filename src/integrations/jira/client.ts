import { getSecrets } from "../../security/secrets.js";
import type { JiraIssue, JiraSearchResult, SimplifiedJiraProject } from "./types.js";
import { httpRequest } from "../../utils/http.js";

export class JiraClient {
  private get authHeader(): string {
    const { jiraEmail, jiraApiToken, jiraBaseUrl } = getSecrets();
    
    // Heuristic: Jira Cloud usually ends in .atlassian.net
    // If custom domain or server/DC, assume Personal Access Token (Bearer)
    // unless user explicitly provided cloud credentials (email + token).
    // However, PAT is safer default for non-atlassian domains.
    if (jiraBaseUrl.includes(".atlassian.net")) {
        return `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;
    }
    
    // Default to Bearer for self-hosted/DC instances using PAT
    return `Bearer ${jiraApiToken}`;
  }

  private get baseUrl(): string {
    return getSecrets().jiraBaseUrl;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {},
    correlationId?: string
  ): Promise<T> {
    // Jira Server/DC usually supports API v2. Cloud supports v3.
    // Ideally this should be configurable, but v2 is safer common partial denominator.
    const url = `${this.baseUrl}/rest/api/2${path}`;

    return await httpRequest<T>(url, {
      ...options,
      correlationId,
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  async searchIssues(
    jql: string,
    maxResults: number = 10,
    correlationId?: string
  ): Promise<JiraSearchResult> {
    const params = new URLSearchParams({
      jql,
      maxResults: maxResults.toString(),
      fields: "summary,status,priority,assignee,description",
    });

    return this.fetch<JiraSearchResult>(
      `/search?${params.toString()}`,
      {},
      correlationId
    );
  }

  async getIssue(issueKey: string, correlationId?: string): Promise<JiraIssue> {
    return this.fetch<JiraIssue>(
      `/issue/${issueKey}?fields=summary,status,priority,assignee,description`,
      {},
      correlationId
    );
  }

  async getProjects(correlationId?: string): Promise<SimplifiedJiraProject[]> {
    return this.fetch<SimplifiedJiraProject[]>(
      `/project`,
      {},
      correlationId
    );
  }
}

export const jiraClient = new JiraClient();
