
export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress?: string;
    };
  };
}

export interface SimplifiedJiraIssue {
  key: string;
  summary: string;
  status: string;
  priority?: string;
  assignee?: string;
  description?: string;
}

export interface JiraSearchResult {
  issues: JiraIssue[];
  total: number;
}
