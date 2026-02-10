import { getSecrets } from "../../security/secrets.js";
import type { JiraIssue, JiraSearchResult } from "./types.js";
import { httpRequest } from "../../utils/http.js";

export class JiraClient {
  private get authHeader(): string {
    const { jiraEmail, jiraApiToken } = getSecrets();
    return `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;
  }

  private get baseUrl(): string {
    return getSecrets().jiraBaseUrl;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {},
    correlationId?: string
  ): Promise<T> {
    const url = `${this.baseUrl}/rest/api/3${path}`;

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
}

export const jiraClient = new JiraClient();
