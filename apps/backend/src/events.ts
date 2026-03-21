const GITHUB_API = "https://api.github.com";

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  payload: {
    action?: string;
    commits?: { sha: string }[];
    pull_request?: { merged?: boolean };
  };
}

interface ActionEvents {
  action: string;
  ids: string[];
}

function extractActions(event: GitHubEvent): ActionEvents[] {
  const results: ActionEvents[] = [];
  switch (event.type) {
    case "PushEvent":
      if (event.payload.commits?.length) {
        results.push({ action: "COMMIT", ids: event.payload.commits.map((c) => c.sha) });
      }
      break;
    case "IssuesEvent":
      if (event.payload.action === "opened") {
        results.push({ action: "OPEN_ISSUE", ids: [event.id] });
      }
      break;
    case "PullRequestEvent":
      if (event.payload.action === "opened") {
        results.push({ action: "CREATE_PR", ids: [event.id] });
      } else if (event.payload.action === "closed" && event.payload.pull_request?.merged) {
        results.push({ action: "MERGE_PR", ids: [event.id] });
      }
      break;
    case "PullRequestReviewEvent":
      results.push({ action: "REVIEW", ids: [event.id] });
      break;
  }
  return results;
}

export async function fetchUserEvents(username: string, token: string): Promise<GitHubEvent[]> {
  const resp = await fetch(`${GITHUB_API}/users/${username}/events?per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!resp.ok) throw new Error(`GitHub Events API ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

/**
 * Groups events by action type, returning only those after `since`.
 * Does not deduplicate — caller should use filterAndMarkProcessed for that.
 */
export function extractEvents(
  events: GitHubEvent[],
  since: Date,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const event of events) {
    if (new Date(event.created_at) < since) continue;
    for (const { action, ids } of extractActions(event)) {
      if (!result[action]) result[action] = [];
      result[action].push(...ids);
    }
  }
  return result;
}
