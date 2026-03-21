# TON Hackathon Plan — Productivity Escrow Mini App

## Status Note

This file describes the target product direction for `Motivaton`.

It does not describe the current implementation state of the repository by itself. The actual codebase is still largely the TON x402 hackathon starter described in [README.md](/Users/antoinebastide/Documents/Github/Perso/motivaton/README.md).

Use this interpretation:

- `README.md`: implemented today
- `plan.md`: intended next product direction
- `AGENTS.md`: quick repository state and the log of substantial completed tasks

## Maintenance Rule

When a substantial task from this plan is completed, add a dedicated section for it in [AGENTS.md](/Users/antoinebastide/Documents/Github/Perso/motivaton/AGENTS.md) under `Completed Substantial Tasks` so future contributors can quickly understand what has already been done.

## Project Summary

**Working name:** GoalVault / StudyBond / Proof-to-Unlock

We are building a **Telegram Mini App on TON mainnet** where one person (a parent, friend, partner, or even the user themselves) locks a certain amount of TON into a challenge, and the beneficiary progressively unlocks the money by completing verified productivity goals.

For the first version, the productivity source will be **Duolingo**. Later, we can add **GitHub**.

This is **not traditional staking**.  
It is better described as a **productivity escrow**:

* A sponsor deposits TON into a challenge
* A beneficiary completes daily goals
* Verified progress unlocks rewards over time
* Missed rewards remain locked and can be refunded to the sponsor at the end

\---

# 1\. Product Idea

## Problem

People struggle to stay consistent with long-term habits such as:

* language learning
* coding practice
* studying
* daily productivity

Motivation is weak when there is no consequence or immediate reward.

## Solution

Create a system where:

* someone funds your challenge
* you only unlock money if you actually do the work
* progress is checked through Duolingo first
* rewards are released progressively

## Why this fits TON + Telegram

This product is very strong for TON because:

* it uses **real on-chain money**
* it works well as a **Telegram Mini App**
* it has a strong **viral distribution path through Telegram**
* it feels native to chat-based accountability
* it has a clean story for judges:

  * real problem
  * real money
  * clear incentive loop
  * realistic user adoption path

\---

# 2\. MVP Scope

## What we will build

A simple **Telegram Mini App** + **TON smart contract** + **backend verifier**.

### MVP Flow

1. User opens the Telegram Mini App
2. Sponsor connects wallet
3. Beneficiary connects wallet
4. Sponsor creates and funds a challenge in TON
5. Beneficiary links Duolingo username
6. Daily progress is checked
7. If today’s goal is achieved, beneficiary can claim today’s reward
8. At the end, any unearned amount goes back to sponsor

\---

# 3\. Core Challenge Model

## Example challenge

* Sponsor deposits: **3 TON**
* Duration: **30 days**
* Daily reward: **0.1 TON**
* Goal: **1 verified Duolingo completion per day**

### Outcome

* If the beneficiary completes a day’s objective, they unlock **0.1 TON**
* If they miss a day, that day’s reward stays locked
* At the end:

  * earned TON goes to beneficiary
  * unearned TON is refundable to sponsor

\---

# 4\. Product Features

## Must-have features

### User side

* Connect TON wallet
* Create challenge
* Join challenge
* View challenge progress
* Claim unlocked rewards
* See remaining locked amount

### Sponsor side

* Fund challenge
* View progress
* Refund unclaimed amount after challenge ends

### Backend side

* Verify productivity proof
* Sign approval for valid rewards
* Store challenge metadata
* Run daily checks / reminders

### Telegram side

* Telegram Mini App interface
* Telegram bot reminders
* Deep link into the challenge

\---

# 5\. Best Technical Approach

## Important decision

For the hackathon, we should **not** try to make the productivity verification fully on-chain.

The correct design is:

* productivity data stays **off-chain**
* TON handles **money custody and payout**
* backend verifies progress
* backend signs a proof
* smart contract releases funds only when given a valid proof

This is the simplest and strongest architecture for a hackathon.

\---

# 6\. Architecture

## A. Frontend

### Stack

* Telegram Mini App
* React / Next.js
* TON Connect

### Pages

* Home page
* Create challenge page
* Join / challenge detail page
* Claim page
* Sponsor dashboard page

\---

## B. Smart Contract

### Contract name

`ProductivityEscrow`

### Contract state

* sponsor address
* beneficiary address
* total deposit
* start date
* end date
* total checkpoints
* amount per checkpoint
* number of claimed checkpoints
* backend verifier public key
* bitmap / mapping of claimed days
* status

### Main methods

* `createChallenge`
* `claimCheckpoint`
* `refundUnclaimed`
* `cancelBeforeStart`

### Key logic

* contract receives TON from sponsor
* contract holds funds in escrow
* beneficiary can only claim if proof is signed by backend verifier
* each checkpoint can only be claimed once
* at the end sponsor refunds what remains

\---

## C. Backend

### Responsibilities

* authenticate Telegram user
* verify wallet ownership
* store challenge metadata
* track Duolingo progress
* sign valid reward proofs
* send Telegram reminders

### Suggested stack

* Node.js / TypeScript
* Express / Fastify
* PostgreSQL or Supabase
* cron jobs for daily checks

### Main API routes

* `POST /challenge/create`
* `POST /challenge/link-duolingo`
* `GET /challenge/:id`
* `POST /challenge/:id/check-progress`
* `POST /challenge/:id/get-claim-proof`
* `POST /telegram/webhook`

\---

# 7\. Verification Model

## Best hackathon model

The backend decides whether a given checkpoint was completed.

If yes, the backend signs:

* challenge id
* beneficiary address
* checkpoint id
* claimable amount
* expiry timestamp

Then:

* beneficiary submits this signed proof to the contract
* contract verifies signature
* contract releases TON

## Why this is ideal

* simple to implement
* secure enough for hackathon MVP
* allows external activity tracking
* keeps contract cheap and clean
* works with Duolingo / GitHub / future integrations

\---

# 8\. Duolingo Integration Strategy

## Phase 1

Only support **Duolingo**

### Goal

Prove one use case end-to-end:

* study habit
* daily reward
* Telegram reminder
* TON payout

## Important practical point

Duolingo integration may be fragile depending on what data is accessible and how reliable it is.

So we should architect the app with a generic verifier interface.

### Verifier interface idea

* `checkCheckpoint(user, challenge, checkpointId) -> success/failure`
* `getProof(user, challenge, checkpointId) -> signed proof`

This way:

* we can start with Duolingo
* later we can plug GitHub easily
* if Duolingo becomes difficult, we still have a reusable core system

\---

# 9\. What We Must NOT Overbuild

## Cut all of this for the hackathon

* multiple goal providers at launch
* multiple beneficiaries
* complex group challenges
* jetton / stablecoin support
* social feed
* NFT badges
* referral economy
* leaderboard
* advanced penalty mechanisms
* subscriptions
* AI agents
* charity slashing
* DAO governance

## Focus only on one clean happy path

**Sponsor funds a Duolingo challenge -> beneficiary completes goal -> beneficiary claims TON -> sponsor refunds leftovers**

That is enough.

\---

# 10\. Target Users

## Primary users

* students
* parents motivating kids
* friends holding each other accountable
* language learners
* self-improvers

## Strong early user story

A parent funds a child’s Duolingo challenge and rewards consistency with real money.

This is extremely easy to explain in a pitch.

\---

# 11\. Monetization

## Good hackathon monetization story

We may not implement all of this, but we should mention it.

### Monetization options

* challenge creation fee
* small percentage fee on unlocked rewards
* premium accountability plans
* family plan
* school or coaching dashboards
* branded sponsor challenges
* GitHub productivity plans for dev teams

## MVP monetization statement

We can take:

* a tiny platform fee on challenge creation
or
* a small success fee when claims are made

\---

# 12\. Telegram Growth Strategy

## Why distribution is credible

Telegram is the main acquisition channel.

### Growth loop

* user creates challenge
* sponsor shares challenge in Telegram
* beneficiary joins from Telegram
* Telegram bot sends reminders
* user shares progress with accountability partner
* group challenges can come later

## Strong pitch line

“This is a money-powered accountability system designed for Telegram-native distribution.”

\---

# 13\. Deliverables for Hackathon

We need to submit:

* repo link
* short README
* live demo or runnable local demo
* 5 minute pitch
* ability to answer judges’ questions for 5 minutes

## What we should actually prepare

* public GitHub repo
* README with setup and architecture
* deployed Mini App
* deployed TON mainnet contract
* short demo video
* screenshots
* architecture diagram
* pitch deck or pitch notes

\---

# 14\. Hackathon Plan for 2 Hackers

## Hacker 1 — TON / Smart Contract / Wallet Flow

### Main responsibilities

* create TON smart contract
* write and test escrow logic
* implement claim verification
* implement refund flow
* deploy to mainnet
* integrate TON Connect transactions
* support frontend wallet actions

### Detailed tasks

* set up TON project
* write `ProductivityEscrow` contract
* write unit tests
* handle challenge creation parameters
* handle claim proof validation
* prevent double claims
* handle refund after end date
* deploy final mainnet contract
* document contract methods

\---

## Hacker 2 — Telegram / Frontend / Backend

### Main responsibilities

* build Telegram Mini App UI
* create Telegram bot
* create backend API
* connect UI to backend
* add Duolingo integration
* add reminders
* prepare demo and README

### Detailed tasks

* set up frontend app
* set up Telegram bot
* design simple UI
* build create challenge flow
* build challenge detail page
* build claim page
* create database schema
* implement verifier abstraction
* implement Duolingo checker
* generate backend signatures
* send Telegram reminders
* polish user journey

\---

# 15\. Time Plan

## Day 1 — Scope + Foundations

### Goals

* lock final product scope
* define contract and database
* set up repo
* set up Telegram bot
* set up frontend skeleton
* set up backend skeleton

### Day 1 checklist

* \[ ] choose final app name
* \[ ] finalize exact challenge model
* \[ ] create GitHub repo
* \[ ] create frontend project
* \[ ] create backend project
* \[ ] create TON contract project
* \[ ] create Telegram bot
* \[ ] write initial architecture notes
* \[ ] decide proof format

\---

## Day 1 / Day 2 — Core Build

### Smart contract

* \[ ] create escrow contract
* \[ ] add create challenge
* \[ ] add claim function
* \[ ] add refund function
* \[ ] add signature verification
* \[ ] add tests

### Frontend

* \[ ] create home page
* \[ ] create wallet connect flow
* \[ ] create create-challenge page
* \[ ] create challenge page
* \[ ] create claim button flow

### Backend

* \[ ] create DB tables
* \[ ] create challenge routes
* \[ ] add Telegram auth/session
* \[ ] add wallet verification
* \[ ] add Duolingo linking
* \[ ] add checkpoint verification
* \[ ] add signed proof generation

\---

## Day 2 — Integration

### Goals

* connect all layers end-to-end
* make one complete happy path work
* test on mainnet with tiny amounts

### Checklist

* \[ ] sponsor can create challenge
* \[ ] sponsor can fund challenge
* \[ ] beneficiary can join
* \[ ] beneficiary can link Duolingo
* \[ ] backend can verify progress
* \[ ] backend can generate proof
* \[ ] contract can release reward
* \[ ] refund works after end
* \[ ] Telegram reminder works

\---

## Final Hours — Demo + Polish

### Checklist

* \[ ] clean UI text
* \[ ] add loading/error states
* \[ ] reduce bugs
* \[ ] deploy frontend
* \[ ] deploy backend
* \[ ] deploy contract on mainnet
* \[ ] add screenshots to README
* \[ ] record demo video
* \[ ] prepare 5-minute pitch
* \[ ] rehearse judge Q\&A

\---

# 16\. Repo Structure Suggestion

```text
root/
  apps/
    miniapp/
    backend/
  contracts/
    productivity-escrow/
  docs/
    architecture.md
    pitch-notes.md
    demo-script.md
  README.md
