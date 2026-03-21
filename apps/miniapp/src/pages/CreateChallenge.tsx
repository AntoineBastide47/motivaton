import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import {
  App,
  APP_ACTIONS,
  APP_LABELS,
  type AppAction,
  type ChallengeFormData,
  buildChallengeId,
} from "../types/challenge";

export function CreateChallenge() {
  const navigate = useNavigate();
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  const [app, setApp] = useState<App>(App.Github);
  const [action, setAction] = useState<AppAction>(APP_ACTIONS[App.Github][0].value);
  const [count, setCount] = useState(1);
  const [amount, setAmount] = useState("");
  const [whoIsPaid, setWhoIsPaid] = useState("");
  const [endDate, setEndDate] = useState("");

  const actions = useMemo(() => APP_ACTIONS[app], [app]);

  function handleAppChange(newApp: App) {
    setApp(newApp);
    setAction(APP_ACTIONS[newApp][0].value);
  }

  const challengeId = useMemo(() => buildChallengeId(app, action, count), [app, action, count]);

  const minDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userAddress) {
      await tonConnectUI.openModal();
      return;
    }

    const challenge: ChallengeFormData = {
      whoPays: userAddress,
      whoIsPaid: whoIsPaid || userAddress,
      amount: Math.floor(parseFloat(amount) * 1e9),
      app,
      action,
      count,
      endDate: Math.floor(new Date(endDate).getTime() / 1000),
    };

    const id = buildChallengeId(challenge.app, challenge.action, challenge.count);

    // TODO: send to backend + trigger smart contract transaction
    console.log("Challenge created:", { ...challenge, challengeId: id });
    alert(`Challenge created!\n\nID: ${id}\nAmount: ${amount} TON\nDeadline: ${endDate}`);
  }

  const actionLabel = actions.find((a) => a.value === action)?.label ?? action;

  return (
    <div className="page">
      <h1 className="page-title">Create Challenge</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">App</label>
          <select
            className="form-select"
            value={app}
            onChange={(e) => handleAppChange(e.target.value as App)}
          >
            {Object.values(App).map((a) => (
              <option key={a} value={a}>
                {APP_LABELS[a]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Action</label>
          <select
            className="form-select"
            value={action}
            onChange={(e) => setAction(e.target.value as AppAction)}
          >
            {actions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Times to Complete</label>
          <input
            className="form-input"
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Amount (TON)</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="1.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Who Gets Paid (TON address, leave empty for self)</label>
          <input
            className="form-input"
            type="text"
            placeholder={userAddress || "Connect wallet first"}
            value={whoIsPaid}
            onChange={(e) => setWhoIsPaid(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input
            className="form-input"
            type="date"
            min={minDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        {amount && endDate && (
          <div className="challenge-summary">
            <h3>Challenge Summary</h3>
            <div className="summary-row">
              <span className="summary-label">Challenge ID</span>
              <span>{challengeId}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Goal</span>
              <span>
                {count}x {actionLabel} on {APP_LABELS[app]}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Stake</span>
              <span>{amount} TON</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Deadline</span>
              <span>{new Date(endDate).toLocaleDateString()}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Payer</span>
              <span>{userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Not connected"}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Beneficiary</span>
              <span>
                {whoIsPaid
                  ? `${whoIsPaid.slice(0, 6)}...${whoIsPaid.slice(-4)}`
                  : userAddress
                    ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)} (self)`
                    : "Not connected"}
              </span>
            </div>
          </div>
        )}

        <button type="submit" className="submit-btn">
          {userAddress ? "Create Challenge" : "Connect Wallet"}
        </button>
      </form>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: 12,
          width: "100%",
          padding: 14,
          border: "1px solid #ddd",
          borderRadius: 10,
          fontSize: 16,
          background: "transparent",
          color: "var(--tg-theme-text-color)",
          cursor: "pointer",
        }}
      >
        Back
      </button>
    </div>
  );
}
