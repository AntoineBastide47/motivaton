import type { Verifier } from "./types.js";
import { duolingoVerifier } from "./duolingo.js";
import { githubVerifier } from "./github.js";
import { leetcodeVerifier } from "./leetcode.js";

const verifiers: Record<string, Verifier> = {
  DUOLINGO: duolingoVerifier,
  GITHUB: githubVerifier,
  LEETCODE: leetcodeVerifier,
};

export function getVerifier(app: string): Verifier | undefined {
  return verifiers[app];
}

export type { VerifyRequest, VerificationResult, Verifier } from "./types.js";
