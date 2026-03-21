import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import { getAllChallenges, type OnChainChallenge } from "../contract";
import { APP_LABELS, formatActionLabel, parseChallengeId } from "../types/challenge";

type IndexedChallenge = OnChainChallenge & { index: number };

function ChallengeCard({ challenge }: { challenge: IndexedChallenge }) {
  const { app: appKey, action, count } = parseChallengeId(challenge.challengeId);
  const appLabel = APP_LABELS[appKey as keyof typeof APP_LABELS] ?? appKey;
  const actionLabel = formatActionLabel(action);
  const progressPct = Math.min(
    100,
    Math.round((challenge.claimedCount / challenge.totalCheckpoints) * 100),
  );
  const expired = Date.now() / 1000 > challenge.endDate;
  const status = !challenge.active
    ? challenge.claimedCount >= challenge.totalCheckpoints
      ? "completed"
      : "closed"
    : expired
      ? "expired"
      : "active";
  const endsAt = new Date(challenge.endDate * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <Link to={`/challenge/${challenge.index}`} className="challenge-card surface">
      <div className="challenge-card-top">
        <div>
          <div className="challenge-card-app">{appLabel}</div>
          <h3 className="challenge-card-title">{actionLabel}</h3>
        </div>
        <span className={`status-pill status-${status}`}>{status}</span>
      </div>

      <p className="challenge-card-copy">
        Unlock {count || challenge.totalCheckpoints} checkpoints before {endsAt}. Each verified step releases part of the escrow.
      </p>

      <div className="challenge-meta">
        <div className="challenge-meta-item">
          <span className="challenge-meta-label">Progress</span>
          <span className="challenge-meta-value">
            {challenge.claimedCount}/{challenge.totalCheckpoints}
          </span>
        </div>
        <div className="challenge-meta-item">
          <span className="challenge-meta-label">Pool</span>
          <span className="challenge-meta-value">
            {(Number(challenge.totalDeposit) / 1e9).toFixed(2)} TON
          </span>
        </div>
        <div className="challenge-meta-item">
          <span className="challenge-meta-label">Ends</span>
          <span className="challenge-meta-value">{endsAt}</span>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="challenge-footer">
        <span>{progressPct}% unlocked</span>
        <span className="challenge-link">Open challenge</span>
      </div>
    </Link>
  );
}

export function Home() {
  const userAddress = useTonAddress();
  const [challenges, setChallenges] = useState<IndexedChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasContractAddress = Boolean(import.meta.env.VITE_CONTRACT_ADDRESS);

  useEffect(() => {
    if (!hasContractAddress) return;
    setLoading(true);
    setError("");
    getAllChallenges()
      .then(setChallenges)
      .catch((e) => {
        console.error("Failed to load challenges:", e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [hasContractAddress]);

  const myChallenges = userAddress
    ? challenges.filter((c) => c.sponsor === userAddress || c.beneficiary === userAddress)
    : [];
  const myIds = new Set(myChallenges.map((c) => c.index));
  const browseChallenges = challenges.filter((c) => !myIds.has(c.index));

  return (
    <div className="page">
      <header className="surface surface-accent hero-panel">
        <div className="hero-row">
          <div>
            <div className="eyebrow">Telegram mini app</div>
            <h1 className="page-title">Make the promise cost something.</h1>
          </div>
          <div className="tonconnect-slot">
            <TonConnectButton />
          </div>
        </div>
        <p className="hero-copy">
          Create small accountability escrows on TON. Sponsors lock the stake, beneficiaries unlock it checkpoint by checkpoint.
        </p>
        <div className="button-row" style={{ marginTop: "1.1rem" }}>
          <Link to="/create" className="button-primary">
            Create challenge
          </Link>
          <span className="inline-note">
            {userAddress ? "Wallet connected" : "Connect a wallet to see your role-specific list"}
          </span>
        </div>
      </header>

      {!hasContractAddress && (
        <div className="empty-state">
          <strong>Contract address missing</strong>
          <p>Set `VITE_CONTRACT_ADDRESS` to browse and create on-chain challenges from the miniapp.</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <strong>Could not load challenges</strong>
          <p>{error}</p>
        </div>
      )}

      {userAddress && (
        <section className="detail-stack">
          <div className="section-header">
            <div>
              <h2 className="section-title">Your challenges</h2>
              <p className="section-note">Escrows where you are sponsor or beneficiary.</p>
            </div>
            <span className="inline-note">{myChallenges.length} visible</span>
          </div>
          {loading && <div className="loading-card">Loading your challenges...</div>}
          {!loading && myChallenges.length === 0 && (
            <div className="empty-state">
              <strong>No challenges yet</strong>
              <p>Create the first one and the list will populate here.</p>
            </div>
          )}
          <div className="list-stack">
            {myChallenges.map((c) => (
              <ChallengeCard key={c.index} challenge={c} />
            ))}
          </div>
        </section>
      )}

      <section className="detail-stack">
        <div className="section-header">
          <div>
            <h2 className="section-title">Browse challenges</h2>
            <p className="section-note">Open escrows currently visible on-chain.</p>
          </div>
          <span className="inline-note">{browseChallenges.length} available</span>
        </div>
        {loading && <div className="loading-card">Loading challenges...</div>}
        {!loading && browseChallenges.length === 0 && (
          <div className="empty-state">
            <strong>No public challenges to browse</strong>
            <p>Once new escrows are created, they will appear here.</p>
          </div>
        )}
        <div className="list-stack">
          {browseChallenges.map((c) => (
            <ChallengeCard key={c.index} challenge={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
