import type { Verifier, VerifyRequest, VerificationResult } from "./types.js";

/** Stub — no GitHub API calls yet. Always returns not verified. */
export const githubVerifier: Verifier = {
  async verify(req: VerifyRequest): Promise<VerificationResult> {
    return {
      verified: false,
      currentCount: 0,
      targetCount: req.count,
      message: "GitHub verification not yet implemented. Use manual increment on-chain.",
    };
  },
};
