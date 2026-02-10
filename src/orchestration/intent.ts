
export type IntentKind = 'JIRA_SEARCH' | 'JIRA_GET' | 'HELP' | 'UNKNOWN' | 'JIRA_LIST_PROJECTS';

export interface Intent {
  kind: IntentKind;
  parameters?: Record<string, any>;
  rawCommand: string;
}

export class IntentParser {
  parse(text: string): Intent {
    const trimmed = text.trim();
    
    if (!trimmed.startsWith('/jira')) {
      return { kind: 'UNKNOWN', rawCommand: text };
    }

    const simpleParts = trimmed.split(' ');
    const command = simpleParts[1]?.toLowerCase();

    if (command === 'search') {
      // /jira search <JQL>
      const jql = trimmed.substring('/jira search'.length).trim();
      if (!jql) return { kind: 'HELP', rawCommand: text };
      return { kind: 'JIRA_SEARCH', parameters: { jql }, rawCommand: text };
    }

    if (command === 'issue') {
      // /jira issue <KEY>
      const issueKey = simpleParts[2];
      if (!issueKey) return { kind: 'HELP', rawCommand: text };
      return { kind: 'JIRA_GET', parameters: { issueKey }, rawCommand: text };
    }

    if (command === 'mine') {
       // /jira mine [projectKey]
       // This is a shortcut for search assignee = currentUser()
       const projectKey = simpleParts[2];
       let jql = 'assignee = currentUser()';
       if (projectKey) {
         jql += ` AND project = "${projectKey}"`;
       }
       jql += ' ORDER BY updated DESC';
       return { kind: 'JIRA_SEARCH', parameters: { jql }, rawCommand: text };
    }

    if (command === 'open') {
        // /jira open [projectKey]
        // Shortcut for search status = Open
        const projectKey = simpleParts[2];
        let jql = 'status = "Open"';
         if (projectKey) {
         jql += ` AND project = "${projectKey}"`;
       }
       jql += ' ORDER BY priority DESC';
       return { kind: 'JIRA_SEARCH', parameters: { jql }, rawCommand: text };
    }

    if (command === 'projects') {
       // /jira projects
       return { kind: 'JIRA_LIST_PROJECTS', rawCommand: text };
    }

    if (command === 'list') {
        // /jira list <ProjectKey> => search project = <Key> ORDER BY created DESC
        const projectKey = simpleParts[2];
        if (!projectKey) return { kind: 'HELP', rawCommand: text };
        
        const jql = `project = "${projectKey}" ORDER BY created DESC`;
        return { kind: 'JIRA_SEARCH', parameters: { jql }, rawCommand: text };
    }

    if (command === 'help') {
        return { kind: 'HELP', rawCommand: text };
    }

    return { kind: 'HELP', rawCommand: text }; // Default to help for unknown commands
  }
}

export const intentParser = new IntentParser();
