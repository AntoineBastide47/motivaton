import { Router } from "express";
import { Address } from "@ton/core";
import { getVerifier } from "../verifiers/index.js";
import { signCheckpointProof, getVerifierPublicKey } from "../signer.js";
import { getChallenge } from "../chain.js";

export const verifyRouter = Router();

/**
 * POST /api/verify/check
 * Stateless verification: checks if the challenge goal is met via the external API.
 *
 * Body: { app, action, count, duolingoUsername? }
 */
verifyRouter.post("/check", async (req, res) => {
  const { app, action, count, duolingoUsername } = req.body;

  if (!app || !action || !count) {
    res.status(400).json({ error: "Missing required fields: app, action, count." });
    return;
  }

  const verifier = getVerifier(app);
  if (!verifier) {
    res.status(400).json({ error: `Unsupported app: ${app}` });
    return;
  }

  const result = await verifier.verify({ app, action, count, duolingoUsername });
  res.json(result);
});

/**
 * POST /api/verify/sign-proof
 * Reads the challenge from the contract to get the real app/action/count,
 * verifies progress, then returns a signed proof.
 *
 * The verification threshold is per-checkpoint: for checkpoint N (0-indexed),
 * the required count is (N + 1).
 *
 * Body: {
 *   challengeIdx,        // on-chain challenge index
 *   checkpointIndex,     // which checkpoint to claim
 *   beneficiaryAddress,  // must match on-chain beneficiary
 *   duolingoUsername?     // for Duolingo verification
 * }
 */
verifyRouter.post("/sign-proof", async (req, res) => {
  const { challengeIdx, checkpointIndex, beneficiaryAddress, duolingoUsername } = req.body;

  if (challengeIdx == null || checkpointIndex == null || !beneficiaryAddress) {
    res.status(400).json({ error: "Missing required fields: challengeIdx, checkpointIndex, beneficiaryAddress." });
    return;
  }

  // Read the challenge from the contract — source of truth
  let challenge;
  try {
    challenge = await getChallenge(challengeIdx);
  } catch (e: any) {
    res.status(500).json({ error: `Failed to read challenge from chain: ${e.message}` });
    return;
  }

  if (!challenge) {
    res.status(404).json({ error: `Challenge ${challengeIdx} not found on-chain.` });
    return;
  }

  // Verify beneficiary matches
  const beneficiary = Address.parse(beneficiaryAddress);
  if (challenge.beneficiary !== beneficiary.toString()) {
    res.status(403).json({ error: "Beneficiary address does not match on-chain challenge." });
    return;
  }

  if (!challenge.active) {
    res.status(400).json({ error: "Challenge is not active." });
    return;
  }

  if (Date.now() / 1000 > challenge.endDate) {
    res.status(400).json({ error: "Challenge has expired." });
    return;
  }

  if (checkpointIndex >= challenge.totalCheckpoints) {
    res.status(400).json({ error: "Invalid checkpoint index." });
    return;
  }

  // Parse challengeId to get app/action/count
  const parts = challenge.challengeId.split(":");
  if (parts.length < 3) {
    res.status(400).json({ error: `Invalid challengeId format: ${challenge.challengeId}` });
    return;
  }
  const [app, action] = parts;

  const verifier = getVerifier(app);
  if (!verifier) {
    res.status(400).json({ error: `Unsupported app: ${app}` });
    return;
  }

  // Per-checkpoint threshold: checkpoint N requires at least (N + 1) completions
  const requiredForCheckpoint = checkpointIndex + 1;

  const result = await verifier.verify({
    app,
    action,
    count: requiredForCheckpoint,
    duolingoUsername,
  });

  if (!result.verified) {
    res.status(403).json({
      error: "Verification failed.",
      details: {
        ...result,
        requiredForCheckpoint,
        message: `Checkpoint ${checkpointIndex} requires at least ${requiredForCheckpoint} completions. ${result.message}`,
      },
    });
    return;
  }

  const signature = signCheckpointProof(challengeIdx, checkpointIndex, beneficiary);

  res.json({
    verified: true,
    signature: signature.toString("base64"),
    challengeIdx,
    checkpointIndex,
    beneficiaryAddress,
  });
});

/**
 * GET /api/verify/public-key
 * Returns the verifier public key (needed for contract deployment).
 */
verifyRouter.get("/public-key", (_req, res) => {
  try {
    const pubKey = getVerifierPublicKey();
    res.json({ publicKey: pubKey.toString("hex") });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
