/** Supported productivity apps */
export enum App {
  Github = "GITHUB",
  Duolingo = "DUOLINGO",
}

/** Actions available per app */
export enum GithubAction {
  Commit = "COMMIT",
  PullRequest = "PR",
  Issue = "ISSUE",
  Review = "REVIEW",
}

export enum DuolingoAction {
  CompleteLesson = "COMPLETE_LESSON",
  EarnPoints = "EARN_POINTS",
  MaintainStreak = "MAINTAIN_STREAK",
}

export type AppAction = GithubAction | DuolingoAction;

/** Map from App to its available actions */
export const APP_ACTIONS: Record<App, { value: AppAction; label: string }[]> = {
  [App.Github]: [
    { value: GithubAction.Commit, label: "Commit" },
    { value: GithubAction.PullRequest, label: "Pull Request" },
    { value: GithubAction.Issue, label: "Open Issue" },
    { value: GithubAction.Review, label: "Code Review" },
  ],
  [App.Duolingo]: [
    { value: DuolingoAction.CompleteLesson, label: "Complete Lesson" },
    { value: DuolingoAction.EarnPoints, label: "Earn Points" },
    { value: DuolingoAction.MaintainStreak, label: "Maintain Streak" },
  ],
};

export const APP_LABELS: Record<App, string> = {
  [App.Github]: "GitHub",
  [App.Duolingo]: "Duolingo",
};

/** Challenge as submitted from the form */
export interface ChallengeFormData {
  /** TON address of the person who pays */
  whoPays: string;
  /** TON address of the person who gets paid */
  whoIsPaid: string;
  /** Amount in TON (nanotons) */
  amount: number;
  /** Selected app */
  app: App;
  /** Selected action within the app */
  action: AppAction;
  /** How many times the action must be completed */
  count: number;
  /** Unix timestamp for the challenge deadline */
  endDate: number;
}

/**
 * On-chain challenge representation.
 * challengeId format: {APP_NAME}:{ACTION}:{COUNT}
 */
export interface Challenge extends ChallengeFormData {
  challengeId: string;
}

/** Builds the challengeId string from its parts */
export function buildChallengeId(app: App, action: AppAction, count: number): string {
  return `${app}:${action}:${count}`;
}
