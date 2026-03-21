import type { Verifier } from "./types.js";
import { duolingoVerifier } from "./duolingo.js";
import { githubVerifier } from "./github.js";

const verifiers: Record<string, Verifier> = {
  DUOLINGO: duolingoVerifier,
  GITHUB: githubVerifier,
};

export function getVerifier(app: string): Verifier | undefined {
  return verifiers[app];
}

export type { VerifyRequest, VerificationResult, Verifier } from "./types.js";
