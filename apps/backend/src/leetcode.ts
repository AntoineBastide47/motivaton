import type { EventEntry } from "./store.js";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

interface ProblemDifficulty {
  titleSlug: string;
  difficulty: string; // "Easy" | "Medium" | "Hard"
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const resp = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) throw new Error(`LeetCode GraphQL ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  if (json.errors?.length) throw new Error(`LeetCode GraphQL error: ${json.errors[0].message}`);
  return json.data;
}

export async function fetchRecentAcceptedSubmissions(username: string, limit = 50): Promise<LeetCodeSubmission[]> {
  const data = await graphql<{ recentAcSubmissionList: LeetCodeSubmission[] }>(
    `query ($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }`,
    { username, limit },
  );
  return data.recentAcSubmissionList ?? [];
}

// Cache problem difficulties to avoid repeated lookups
const difficultyCache = new Map<string, string>();

async function fetchProblemDifficulty(titleSlug: string): Promise<string> {
  const cached = difficultyCache.get(titleSlug);
  if (cached) return cached;

  try {
    const data = await graphql<{ question: { difficulty: string } | null }>(
      `query ($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          difficulty
        }
      }`,
      { titleSlug },
    );
    const diff = data.question?.difficulty ?? "Unknown";
    difficultyCache.set(titleSlug, diff);
    return diff;
  } catch {
    return "Unknown";
  }
}

export async function fetchUserStreak(username: string): Promise<number> {
  const data = await graphql<{ matchedUser: { userCalendar: { streak: number } } | null }>(
    `query ($username: String!) {
      matchedUser(username: $username) {
        userCalendar {
          streak
        }
      }
    }`,
    { username },
  );
  return data.matchedUser?.userCalendar?.streak ?? 0;
}

export async function extractLeetCodeEvents(
  submissions: LeetCodeSubmission[],
  since: Date,
): Promise<Record<string, EventEntry[]>> {
  const result: Record<string, EventEntry[]> = {};

  const filtered = submissions.filter((sub) => new Date(Number(sub.timestamp) * 1000) >= since);

  // Check if any difficulty-specific actions are needed by collecting all slugs first
  const slugs = [...new Set(filtered.map((s) => s.titleSlug))];
  const difficulties = new Map<string, string>();
  await Promise.all(
    slugs.map(async (slug) => {
      difficulties.set(slug, await fetchProblemDifficulty(slug));
    }),
  );

  for (const sub of filtered) {
    const difficulty = difficulties.get(sub.titleSlug) ?? "Unknown";

    // SOLVE_PROBLEM — all accepted submissions
    if (!result["SOLVE_PROBLEM"]) result["SOLVE_PROBLEM"] = [];
    result["SOLVE_PROBLEM"].push({ id: sub.id, count: 1 });

    // Difficulty-specific actions
    const diffAction = `SOLVE_${difficulty.toUpperCase()}`;
    if (diffAction === "SOLVE_EASY" || diffAction === "SOLVE_MEDIUM" || diffAction === "SOLVE_HARD") {
      if (!result[diffAction]) result[diffAction] = [];
      result[diffAction].push({ id: `${sub.id}_${diffAction}`, count: 1 });
    }
  }

  return result;
}

export async function verifyLeetCodeUsername(username: string): Promise<boolean> {
  try {
    const data = await graphql<{ matchedUser: { username: string } | null }>(
      `query ($username: String!) {
        matchedUser(username: $username) {
          username
        }
      }`,
      { username },
    );
    return data.matchedUser != null;
  } catch {
    return false;
  }
}
