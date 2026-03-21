import type { Verifier, VerifyRequest, VerificationResult } from "./types.js";

const DUOLINGO_API = "https://www.duolingo.com/2017-06-30/users";

interface DuolingoUser {
  streak: number;
  totalXp: number;
}

async function fetchProfile(username: string): Promise<DuolingoUser | null> {
  try {
    const res = await fetch(
      `${DUOLINGO_API}?username=${encodeURIComponent(username)}&fields=streak,totalXp`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.users || data.users.length === 0) return null;
    return data.users[0] as DuolingoUser;
  } catch {
    return null;
  }
}

export const duolingoVerifier: Verifier = {
  async verify(req: VerifyRequest): Promise<VerificationResult> {
    if (!req.duolingoUsername) {
      return { verified: false, currentCount: 0, targetCount: req.count, message: "No Duolingo username provided." };
    }

    const profile = await fetchProfile(req.duolingoUsername);
    if (!profile) {
      return { verified: false, currentCount: 0, targetCount: req.count, message: `Could not fetch profile for "${req.duolingoUsername}".` };
    }

    let currentCount: number;
    switch (req.action) {
      case "MAINTAIN_STREAK":
        currentCount = profile.streak;
        break;
      case "EARN_POINTS":
        currentCount = profile.totalXp;
        break;
      case "COMPLETE_LESSON":
        currentCount = Math.floor(profile.totalXp / 10);
        break;
      default:
        currentCount = 0;
    }

    const verified = currentCount >= req.count;
    return {
      verified,
      currentCount,
      targetCount: req.count,
      message: verified
        ? `Verified! ${currentCount}/${req.count} reached.`
        : `Not yet: ${currentCount}/${req.count}.`,
    };
  },
};
