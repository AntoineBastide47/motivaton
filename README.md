# Motivaton

Telegram Mini App that locks TON behind real productivity. Create escrow challenges tied to GitHub commits, LeetCode solves, Chess.com wins, or Strava runs. A cron polls each platform's API, tracks progress per checkpoint, and auto-claims rewards on-chain when the goal is met. A Telegram bot posts live updates, milestones, and trash talk to group chats.

## How It Works

1. **Lock** — A sponsor creates a challenge on the TON smart contract, depositing TON split across checkpoints.
2. **Track** — The backend polls GitHub, LeetCode, Chess.com, or Strava every minute for verified activity.
3. **Claim** — When progress meets the target, the backend auto-signs and sends a `ClaimAll` transaction. The TON goes to the beneficiary.

No manual verification. The money moves when the work is done.

## Architecture

```
contracts/productivity-escrow/   Tact smart contract (TON)
apps/backend/                    Express backend (cron, auth, verification, auto-claim, bot)
apps/miniapp/                    React frontend (Telegram Mini App)
```

### Smart Contract

- `CreateChallenge` — sponsor locks TON with a checkpoint count, deadline, and challenge ID
- `AddFunds` — anyone can add TON to an existing challenge
- `ClaimAll` — batch-claims all earned checkpoints in one transaction (beneficiary or operator)
- `RefundUnclaimed` — sponsor reclaims unclaimed funds after deadline
- Ed25519 signature verification for claim proofs
- Nonce-based redeployment for immutable contract upgrades

### Backend

- **Cron** — polls GitHub Events API, LeetCode GraphQL, Chess.com API, Strava API every minute
- **Auto-claim** — detects completed challenges and sends `ClaimAll` transactions using the operator wallet
- **Auth** — GitHub OAuth, Strava OAuth, LeetCode/Chess.com username linking
- **Telegram bot** — webhook-based, `/start` for DMs, `/track` for group challenge tracking
- **Group notifications** — progress updates, 25/50/75% milestones, inactivity warnings, deadline alerts, trash talk
- **DM notifications** — claim confirmation sent to the beneficiary
- **AI inspection** — optional Cocoon/OpenAI veto layer that blocks suspicious commits and activities before they count as progress

### Frontend

- Telegram Mini App built with React + TonConnect
- Challenge creation, funding, progress tracking, and claiming
- Per-platform account linking (OAuth for GitHub/Strava, username for LeetCode/Chess.com)
- "Add bot to group" deep link for social tracking

## Supported Platforms

| Platform | Actions |
|---|---|
| GitHub | Commit, Create PR, Merge PR, Open Issue, Code Review |
| LeetCode | Solve Problem, Solve Easy/Medium/Hard, Maintain Streak |
| Chess.com | Play Game, Win Game, Win Rapid/Blitz/Bullet |
| Strava | Log Activity, Run, Ride, Swim, Walk, Log Kilometers |

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `CONTRACT_ADDRESS` | Deployed smart contract address |
| `VITE_CONTRACT_ADDRESS` | Same address, for the frontend build |
| `WALLET_MNEMONIC` | 24-word mnemonic for the operator wallet (auto-claim) |
| `VERIFIER_SECRET_KEY` | 64-byte hex ed25519 key for signing claim proofs |
| `VERIFIER_PUBLIC_KEY` | Matching public key (stored in contract at deploy) |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `PUBLIC_URL` | Backend public URL (for OAuth callbacks and bot webhook) |
| `TON_RPC_URL` | Toncenter RPC endpoint |
| `RPC_API_KEY` | Toncenter API key |
| `VITE_TON_ENDPOINT` | RPC endpoint for the frontend |
| `VITE_TON_API_KEY` | RPC API key for the frontend |

### Optional

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather |
| `VITE_BOT_USERNAME` | Bot username for share links (default: `MotivaTON_bot`) |
| `STRAVA_CLIENT_ID` | Strava OAuth app client ID |
| `STRAVA_CLIENT_SECRET` | Strava OAuth app client secret |
| `DATABASE_PATH` | SQLite database path (default: `apps/backend/data/motivaton.db`) |
| `FEE_WALLET_A` | Fee wallet for personal challenge refunds (20%) |
| `FEE_WALLET_B` | Fee wallet for personal challenge refunds (80%) |
| `CONTRACT_NONCE` | Nonce for contract deployment (increment to redeploy) |
| `COCOON_API_URL` | Cocoon AI inspection endpoint |
| `COCOON_MODEL` | Cocoon model ID |

## Setup

### Prerequisites

- Node.js >= 18
- pnpm

### Install and Build

```bash
pnpm install
pnpm --filter motivaton-miniapp build
pnpm --filter motivaton-backend build
```

### Deploy Contract

```bash
cd contracts/productivity-escrow
pnpm build
pnpm run deploy:contract
```

Update `CONTRACT_ADDRESS` and `VITE_CONTRACT_ADDRESS` with the output address.

### Run Locally

```bash
node apps/backend/dist/index.js
```

### Deploy to Railway

Push to the connected GitHub repo. Railway builds and deploys from `railway.json`.

### Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Set `TELEGRAM_BOT_TOKEN` in env
3. The bot auto-registers its webhook and commands on startup
4. Set description via `/setdescription` in BotFather

## Project Structure

```
apps/
  backend/
    src/
      index.ts              Express server entry
      cron.ts               Minute-interval polling for all platforms
      autoclaim.ts          Auto-claim completed challenges
      bot.ts                Telegram bot webhook handler
      telegram.ts           Telegram message sending and templates
      group-notifications.ts  Milestone, inactivity, deadline, trash talk
      store.ts              SQLite database (accounts, events, claims, groups)
      chain.ts              TON RPC helpers
      signer.ts             Ed25519 claim proof signing
      events.ts             GitHub event extraction
      leetcode.ts           LeetCode GraphQL client
      chesscom.ts           Chess.com API client
      strava.ts             Strava OAuth and activity client
      cocoon.ts             AI inspection layer
      routes/
        auth.ts             OAuth and username linking
        verify.ts           Claim proof signing endpoint
        webhook.ts          GitHub webhook handler
        debug.ts            Progress and challenge debug endpoints
      verifiers/
        github.ts           GitHub progress verifier
        leetcode.ts         LeetCode progress verifier
        chesscom.ts         Chess.com progress verifier
        strava.ts           Strava progress verifier
  miniapp/
    src/
      pages/
        Home.tsx            Challenge list with filters
        CreateChallenge.tsx  Challenge creation flow
        ChallengeDetail.tsx  Progress, claiming, funding, connection
      contract.ts           TON contract helpers
      api.ts                Backend API client
      challenge-cache.tsx   Shared challenge state provider
      types/challenge.ts    App/Action enums

contracts/
  productivity-escrow/
    src/
      productivity_escrow.tact   Tact smart contract
    scripts/
      deploy.ts                  Deployment script
      keygen.ts                  Ed25519 key generation
```

## License

MIT
