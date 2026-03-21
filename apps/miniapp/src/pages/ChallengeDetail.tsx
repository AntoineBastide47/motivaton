import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import {
  getChallenge,
  isCheckpointClaimed,
  buildClaimCheckpointBody,
  buildRefundUnclaimedBody,
  CONTRACT_ADDRESS,
  toNano,
  type OnChainChallenge,
} from "../contract";
import { backendApi, type VerificationResult } from "../api";
import { APP_LABELS } from "../types/challenge";

export function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  const [challenge, setChallenge] = useState<OnChainChallenge | null>(null);
  const [claimedMap, setClaimedMap] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [duolingoInput, setDuolingoInput] = useState("");

  const idx = parseInt(id || "0", 10);

  useEffect(() => {
    loadChallenge();
  }, [idx]);

  async function loadChallenge() {
    setLoading(true);
    setError("");
    try {
      const c = await getChallenge(idx);
      setChallenge(c);
      if (c) {
        const claimed: boolean[] = [];
        for (let i = 0; i < c.totalCheckpoints; i++) {
          claimed.push(await isCheckpointClaimed(idx, i));
        }
        setClaimedMap(claimed);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!challenge) return;
    const parts = challenge.challengeId.split(":");
    const app = parts[0];
    const action = parts[1];
    const count = parseInt(parts[2] || "0", 10);

    setVerifying(true);
    try {
      const result = await backendApi.check({
        app,
        action,
        count,
        duolingoUsername: duolingoInput || undefined,
      });
      setVerification(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  }

  async function handleClaim() {
    if (!challenge || !userAddress) return;

    // Find first unclaimed checkpoint
    const checkpointIndex = claimedMap.findIndex((c) => !c);
    if (checkpointIndex === -1) {
      alert("All checkpoints already claimed.");
      return;
    }

    setClaiming(true);
    try {
      // Get signed proof from backend (backend reads challenge data from chain)
      const proof = await backendApi.signProof({
        challengeIdx: idx,
        checkpointIndex,
        beneficiaryAddress: userAddress,
        duolingoUsername: duolingoInput || undefined,
      });

      // Send claim transaction
      const body = buildClaimCheckpointBody(idx, checkpointIndex, proof.signature);
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: CONTRACT_ADDRESS,
            amount: toNano("0.05").toString(),
            payload: body.toBoc().toString("base64"),
          },
        ],
      });

      // Reload after claim
      await loadChallenge();
    } catch (e: any) {
      if (!e.message?.includes("Cancelled") && !e.message?.includes("canceled")) {
        alert(e.message || "Claim failed.");
      }
    } finally {
      setClaiming(false);
    }
  }

  async function handleRefund() {
    if (!challenge) return;
    setRefunding(true);
    try {
      const body = buildRefundUnclaimedBody(idx);
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: CONTRACT_ADDRESS,
            amount: toNano("0.05").toString(),
            payload: body.toBoc().toString("base64"),
          },
        ],
      });
      await loadChallenge();
    } catch (e: any) {
      if (!e.message?.includes("Cancelled") && !e.message?.includes("canceled")) {
        alert(e.message || "Refund failed.");
      }
    } finally {
      setRefunding(false);
    }
  }

  if (loading) return <div className="page">Loading...</div>;
  if (error && !challenge) return <div className="page" style={{ color: "red" }}>{error}</div>;
  if (!challenge) return <div className="page">Challenge not found.</div>;

  const parts = challenge.challengeId.split(":");
  const appKey = parts[0] || "";
  const action = parts[1] || "";
  const appLabel = APP_LABELS[appKey as keyof typeof APP_LABELS] ?? appKey;
  const expired = Date.now() / 1000 > challenge.endDate;
  const isBeneficiary = userAddress === challenge.beneficiary;
  const isSponsor = userAddress === challenge.sponsor;
  const progressPct = Math.min(100, Math.round((challenge.claimedCount / challenge.totalCheckpoints) * 100));

  return (
    <div className="page">
      <h1 className="page-title">Challenge</h1>

      <div className="challenge-summary">
        <div className="summary-row">
          <span className="summary-label">ID</span>
          <span>{challenge.challengeId}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">App</span>
          <span>{appLabel}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Action</span>
          <span>{action}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Checkpoints</span>
          <span>{challenge.claimedCount} / {challenge.totalCheckpoints} claimed</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Total Deposit</span>
          <span>{(Number(challenge.totalDeposit) / 1e9).toFixed(2)} TON</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Per Checkpoint</span>
          <span>{(Number(challenge.amountPerCheckpoint) / 1e9).toFixed(4)} TON</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Status</span>
          <span>{!challenge.active ? "Closed" : expired ? "Expired" : "Active"}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Deadline</span>
          <span>{new Date(challenge.endDate * 1000).toLocaleString()}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Sponsor</span>
          <span>{challenge.sponsor.slice(0, 6)}...{challenge.sponsor.slice(-4)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Beneficiary</span>
          <span>{challenge.beneficiary.slice(0, 6)}...{challenge.beneficiary.slice(-4)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ margin: "16px 0", background: "#e0e0e0", borderRadius: 8, height: 12, overflow: "hidden" }}>
        <div style={{ width: `${progressPct}%`, background: !challenge.active && challenge.claimedCount >= challenge.totalCheckpoints ? "#4caf50" : "var(--tg-theme-button-color)", height: "100%", borderRadius: 8, transition: "width 0.3s" }} />
      </div>

      {/* Checkpoint grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {claimedMap.map((claimed, i) => (
          <div
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: claimed ? "#4caf50" : "#e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: claimed ? "#fff" : "var(--tg-theme-hint-color)",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Duolingo username input for verification */}
      {appKey === "DUOLINGO" && challenge.active && !expired && isBeneficiary && (
        <div className="form-group">
          <label className="form-label">Duolingo Username (for verification)</label>
          <input
            className="form-input"
            placeholder="Your Duolingo username"
            value={duolingoInput}
            onChange={(e) => setDuolingoInput(e.target.value)}
          />
        </div>
      )}

      {/* Beneficiary actions */}
      {challenge.active && !expired && isBeneficiary && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button className="submit-btn" onClick={handleVerify} disabled={verifying} style={{ flex: 1 }}>
            {verifying ? "Checking..." : "Verify Progress"}
          </button>
          <button className="submit-btn" onClick={handleClaim} disabled={claiming} style={{ flex: 1, background: "#4caf50" }}>
            {claiming ? "Claiming..." : "Claim Checkpoint"}
          </button>
        </div>
      )}

      {/* Sponsor refund */}
      {expired && challenge.active && isSponsor && challenge.claimedCount < challenge.totalCheckpoints && (
        <button className="submit-btn" onClick={handleRefund} disabled={refunding} style={{ background: "#ff9800" }}>
          {refunding ? "Refunding..." : "Refund Unclaimed"}
        </button>
      )}

      {/* Verification result */}
      {verification && (
        <div className="challenge-summary" style={{ marginTop: 8 }}>
          <h3>Verification Result</h3>
          <div className="summary-row">
            <span className="summary-label">Status</span>
            <span style={{ color: verification.verified ? "#4caf50" : "#ff9800" }}>
              {verification.verified ? "VERIFIED" : "NOT YET"}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Progress</span>
            <span>{verification.currentCount} / {verification.targetCount}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Details</span>
            <span>{verification.message}</span>
          </div>
        </div>
      )}

      {error && <p style={{ color: "#f44336", marginTop: 8 }}>{error}</p>}

      <button
        onClick={() => navigate("/")}
        style={{ marginTop: 12, width: "100%", padding: 14, border: "1px solid #ddd", borderRadius: 10, fontSize: 16, background: "transparent", color: "var(--tg-theme-text-color)", cursor: "pointer" }}
      >
        Back
      </button>
    </div>
  );
}
