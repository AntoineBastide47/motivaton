import { Link } from "react-router-dom";
import { TonConnectButton } from "@tonconnect/ui-react";

export function Home() {
  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Motivaton</h1>
        <TonConnectButton />
      </div>
      <p style={{ marginBottom: 24, color: "var(--tg-theme-hint-color)" }}>
        Create productivity challenges backed by real TON. Hold yourself or a friend accountable.
      </p>
      <Link to="/create" className="nav-btn">
        Create Challenge
      </Link>
    </div>
  );
}
