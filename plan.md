# plan.md

## 1. Objectives
- Build MOVS: a terminal/ASCII-style browser PoW mining app (rpow2-like) with **real SHA-256 mining in Web Workers** + **hybrid time-based reward shaping**.
- Auth via **email magic link** sent through **Resend**.
- Enforce **1,000,000 MOVS cap** with **halving every 10,000 blocks** (initial reward 50 MOVS).
- Core features: **Wallet + tx history**, **Send/Transfer**, **Leaderboard**, **Network stats**, **Recent blocks explorer**.
- Tech: **FastAPI + React + MongoDB + Resend**.

## 2. Implementation Steps

### Phase 1 — Core POC (Isolation; do not proceed until green)
**Goal:** prove the failure-prone core works: Resend integration + PoW validation + chain/reward math + atomic transfers.

1) **Web research (best practices / pitfalls)**
- Resend: API usage, rate limits, verified sender/domain requirements, safe handling of keys.
- Browser PoW: Web Worker performance patterns, difficulty representation, anti-cheat constraints for server-validated PoW.

2) Create `test_core.py` (single-file script) covering:
- **Resend send**: send a magic link email (use env var for API key; verify HTTP 200/202).
- **PoW**: generate challenge (server-style), mine nonce locally, validate SHA-256 meets target.
- **Block**: prev_hash chaining; compute block hash deterministically; store height/time/miner/reward.
- **Reward/halving + cap**: reward schedule at heights; prevent minting past 1,000,000.
- **Transfer**: atomic debit/credit + tx record (simulate with in-memory or Mongo optional); reject insufficient balance.

3) Acceptance gates (must pass):
- Email is delivered (or provider returns success) and link token format is correct.
- PoW: mined nonce validates; invalid nonce rejected.
- Block chain: tamper breaks validation; halving changes reward at 10k boundary.
- Cap never exceeded; transfer is consistent and idempotency-friendly.

**User stories (POC):**
1. As a developer, I can send a magic link via Resend and confirm provider success.
2. As a developer, I can generate a mining challenge and mine a valid nonce.
3. As a developer, I can validate/reject PoW submissions deterministically.
4. As a developer, I can mint block rewards with halving and enforce the 1,000,000 cap.
5. As a developer, I can transfer balances atomically and record a transaction.

---

### Phase 2 — V1 App Development (MVP UI + API; minimal scope, working end-to-end)
**Goal:** build a usable mining dashboard with persistence, but keep mechanics simple enough to be reliable.

1) Backend skeleton `/app/backend`
- FastAPI app (`server.py`) + config (`settings.py`) + Mongo connection.
- Models/collections: `users`, `wallets`, `blocks`, `transactions`, `sessions`, `mining_submissions`.
- Core modules: `auth.py`, `email_service.py`, `mining.py`, `wallet.py`, `network.py`.

2) Auth (magic link + JWT session)
- `POST /api/auth/request-link` (Resend send; fallback to dev-mode return link if send fails).
- `GET /api/auth/verify?token=...` (consume single-use token; issue JWT).
- `GET /api/auth/me`.
- Create wallet on first login; derive address (stable per user).

3) Mining core endpoints
- `GET /api/mine/challenge` returns: challenge_id, seed, prev_hash, height, difficulty/target, expires_at.
- `POST /api/mine/submit` validates: challenge freshness, nonce, hash target, prev_hash continuity; mints reward; writes block + mining tx.
- Difficulty: start low for fast UX; optionally adjust slowly based on recent solve time.

4) Wallet + transfer
- `GET /api/wallet` (address, balance, totals mined).
- `POST /api/wallet/send` (to address or email; atomic update using Mongo transactions where available).
- `GET /api/wallet/transactions` (paged).

5) Stats + leaderboard + explorer
- `GET /api/network/stats` (height, total mined, current reward, difficulty, est hashrate).
- `GET /api/leaderboard` (top miners by total mined).
- `GET /api/blocks/recent`.

6) Frontend `/app/frontend` (React)
- Terminal/ASCII layout: monospace, box drawing, dark theme, green/amber accents.
- Pages: Landing (stats), Login, Verify, Dashboard (tabs: Mine/Send/History), Leaderboard, Explorer.
- Web Worker miner: SHA-256 loop, adjustable throttle, hashrate display, submit on solution.
- i18n toggle ID/EN (simple dictionary + context).
- Polling for stats/tx/blocks updates.

7) Phase 2 test checkpoint (1 round end-to-end)
- Run testing agent: login → mine → reward → send → history → leaderboard → explorer.

**User stories (V1):**
1. As a visitor, I can view MOVS landing stats and toggle ID/EN.
2. As a user, I can request a magic link and log in.
3. As a user, I can start/stop browser mining and see live hashrate.
4. As a user, I receive mining rewards in my wallet and see them in history.
5. As a user, I can send MOVS to another address/email and see the transfer reflected for both sides.

---

### Phase 3 — Feature Completion (match rpow2 feel; harden correctness)
1) Mining hardening
- Server-side anti-replay: challenge IDs, single-use submissions, expiry, per-user rate limits.
- Better difficulty adjustment (bounded) to keep “find block in seconds” target.
- Consistent chain validation on startup (detect forks/invalid blocks for MVP).

2) UX polish (terminal fidelity)
- ASCII widgets for: balance, reward, difficulty, block height, network hash rate.
- Better error states: expired link, invalid token, insufficient funds, stale challenge.

3) Observability + admin
- Structured logs; minimal admin endpoint to view recent errors (optional).

4) Phase 3 test checkpoint (1 round end-to-end)
- Multi-user scenario: two miners compete, leaderboard updates, transfers, halving boundary simulation.

**User stories (completion):**
1. As a user, I see clear terminal-style status for difficulty/reward/height while mining.
2. As a user, I can’t reuse an old nonce/challenge to mint again.
3. As a user, I get clear guidance if my magic link is expired or already used.
4. As a user, I can browse recent blocks and confirm my mined blocks are included.
5. As an admin/developer, I can detect invalid chains or suspicious mining patterns in logs.

---

### Phase 4 — Optional Enhancements (post-v1)
- Referral system, tasks/quests, withdraw/bridge simulation, WebSockets for realtime, mobile responsiveness.

## 3. Next Actions
1) Confirm Resend sender details: provider is **Resend** (key received). Need **From email/domain** to actually deliver reliably.
2) Implement and run `test_core.py` until all acceptance gates pass.
3) Scaffold FastAPI + React + Mongo, implement minimal endpoints + UI for login→dashboard→mine→wallet.
4) Run 1 round of end-to-end testing; iterate on failures.

## 4. Success Criteria
- Users can **log in via Resend magic link**, mine MOVS via **real SHA-256 Web Worker PoW**, and receive **correct halving rewards**.
- **1,000,000 cap** strictly enforced; no double-mint via replay.
- Users can **send/receive MOVS**, and all txs/blocks persist in Mongo.
- Terminal/ASCII UI is consistent; bilingual toggle works site-wide.
- Testing checkpoints pass with stable end-to-end flows.