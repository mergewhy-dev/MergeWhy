// Jira ticket patterns
const JIRA_PATTERN = /\b([A-Z][A-Z0-9]+-\d+)\b/g;
const JIRA_URL_PATTERN =
  /https?:\/\/[^\/]+\.atlassian\.net\/browse\/([A-Z][A-Z0-9]+-\d+)/g;

// Linear ticket patterns
const LINEAR_PATTERN = /\b([A-Z]+-\d+)\b/g;
const LINEAR_URL_PATTERN =
  /https?:\/\/linear\.app\/[^\/]+\/issue\/([A-Z]+-\d+)/g;

// GitHub issue patterns
const GITHUB_ISSUE_PATTERN = /#(\d+)/g;
const GITHUB_ISSUE_URL_PATTERN =
  /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/g;

// Slack thread patterns
const SLACK_PATTERN =
  /https?:\/\/[a-z0-9-]+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/g;

export function extractTicketLinks(text: string): string[] {
  if (!text) return [];

  const tickets = new Set<string>();

  // Reset regex lastIndex
  JIRA_PATTERN.lastIndex = 0;
  JIRA_URL_PATTERN.lastIndex = 0;
  LINEAR_PATTERN.lastIndex = 0;
  LINEAR_URL_PATTERN.lastIndex = 0;

  // Extract Jira tickets
  let match;
  while ((match = JIRA_PATTERN.exec(text)) !== null) {
    tickets.add(match[1]);
  }
  while ((match = JIRA_URL_PATTERN.exec(text)) !== null) {
    tickets.add(match[1]);
  }

  // Extract Linear tickets
  while ((match = LINEAR_PATTERN.exec(text)) !== null) {
    tickets.add(match[1]);
  }
  while ((match = LINEAR_URL_PATTERN.exec(text)) !== null) {
    tickets.add(match[1]);
  }

  return Array.from(tickets);
}

export function extractSlackLinks(text: string): string[] {
  if (!text) return [];

  const matches = text.match(SLACK_PATTERN) || [];
  return [...new Set(matches)];
}

export function extractGitHubIssues(
  text: string,
  repoFullName: string
): string[] {
  if (!text) return [];

  const issues = new Set<string>();

  // Reset regex lastIndex
  GITHUB_ISSUE_PATTERN.lastIndex = 0;
  GITHUB_ISSUE_URL_PATTERN.lastIndex = 0;

  // Extract #123 style references
  let match;
  while ((match = GITHUB_ISSUE_PATTERN.exec(text)) !== null) {
    issues.add(`https://github.com/${repoFullName}/issues/${match[1]}`);
  }

  // Extract full URLs
  while ((match = GITHUB_ISSUE_URL_PATTERN.exec(text)) !== null) {
    issues.add(`https://github.com/${match[1]}/${match[2]}/issues/${match[3]}`);
  }

  return Array.from(issues);
}

export interface ExtractedEvidence {
  ticketLinks: string[];
  slackThreads: string[];
  githubIssues: string[];
}

export function extractAllEvidence(
  text: string,
  repoFullName: string
): ExtractedEvidence {
  return {
    ticketLinks: extractTicketLinks(text),
    slackThreads: extractSlackLinks(text),
    githubIssues: extractGitHubIssues(text, repoFullName),
  };
}
