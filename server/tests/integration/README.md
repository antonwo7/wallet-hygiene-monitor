# Wallet Hygiene Monitor (MVP)

Wallet Hygiene Monitor is a lightweight service that monitors **EVM token approvals** (ERC-20 `Approval`, ERC-721/1155 `ApprovalForAll`) for user wallets and sends **email alerts** when risky approvals are detected.

> MVP focus: **Email only** (SMTP). Telegram and advanced notification pipelines (retries/outbox/dedup) are planned for later versions.

---

## Features (MVP)

### Monitoring
- Networks: **Ethereum**, **Polygon**, **Arbitrum**
- Events:
  - **ERC-20** `Approval(owner, spender, value)`
  - **ERC-721/1155** `ApprovalForAll(owner, operator, approved)`
- Realtime scanner (polling latest blocks with confirmations)
- Backfill on wallet add: scans **last N days** (configurable per chain)

### Risk scoring (v1)
Each event gets:
- `riskScore` (number)
- `riskLevel` (e.g. LOW / MEDIUM / HIGH)
- `reasons[]` explaining why it’s risky

Signals (v1):
- Very large / infinite allowance (`2^256 - 1`)
- `ApprovalForAll = true` (often high risk for NFTs)
- Spender/operator not in allowlist
- Valuable tokens list (optional, per chain)

### Email alerts
- SMTP delivery (Nodemailer)
- Alerts are sent as **batched emails**: one email may contain multiple events (limited by env var)
- Email content includes **risk level/score and reasons**, plus tx explorer link

### Web app (client)
- Authentication: registration, login, password reset
- Dashboard:
  - **Wallets**: add/disable/enable (if implemented), see scanner state
  - **Approvals feed**: filters, risk display, explorer links
  - **Allowlist**: manage trusted spenders/operators
  - **Settings** (minimal): email on/off + risk threshold + “send test email” (if enabled on backend)

---

## Repository Structure

```
/server   # NestJS backend (scanner, risk scoring, SMTP mailer)
/client   # Next.js frontend (dashboard UI)
```

---

## Quick Start (Local)

### 1) Prerequisites
- Node.js 18+ (recommended 20+)
- pnpm (recommended) or npm/yarn
- PostgreSQL
- An RPC provider URL for each chain (QuickNode/Alchemy/Infura/etc.)
- SMTP credentials for sending emails

---

## Backend (Server)

### Install & run
```bash
cd server
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
```

The API should start on the configured port (see `.env`).

### Environment variables
Create `server/.env` (or `.env.local` depending on your setup). Typical variables:

#### App
- `NODE_ENV=development`
- `PORT=...`
- `APP_NAME=Wallet Hygiene Monitor`
- `APP_URL=http://localhost:3000`

#### Database
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME`

#### RPC Providers
- `ETH_RPC_URL=...`
- `POLYGON_RPC_URL=...`
- `ARBITRUM_RPC_URL=...`

#### Scanner
- Confirmations to avoid reorg issues:
  - `ETH_CONFIRMATIONS=...`
  - `POLYGON_CONFIRMATIONS=...`
  - `ARBITRUM_CONFIRMATIONS=...`
- Backfill window (days):
  - `ETH_BACKFILL_DAYS=...`
  - `POLYGON_BACKFILL_DAYS=...`
  - `ARBITRUM_BACKFILL_DAYS=...`
- Avg block time (seconds) for days → blocks conversion:
  - `ETH_AVG_BLOCK_TIME_SECONDS=...`
  - `POLYGON_AVG_BLOCK_TIME_SECONDS=...`
  - `ARBITRUM_AVG_BLOCK_TIME_SECONDS=...`
- Email batch limit:
  - `EVENTS_PER_EMAIL_LIMIT=30` (example)

#### Explorer links (optional but recommended)
Used to build tx URLs in emails / UI:
- `TX_EXPLORER_URL_ETH=https://etherscan.io/tx/{txHash}`
- `TX_EXPLORER_URL_POLYGON=https://polygonscan.com/tx/{txHash}`
- `TX_EXPLORER_URL_ARBITRUM=https://arbiscan.io/tx/{txHash}`

#### SMTP (Email)
- `SMTP_HOST=...`
- `SMTP_PORT=...`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_FROM="Wallet Hygiene Monitor <no-reply@yourdomain.com>"`

> Exact env names may vary slightly depending on your config wrapper. Check `server/src/shared/config` for the authoritative list.

### Main API endpoints (high-level)

#### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET  /auth/me`
- `POST /auth/password/request`
- `POST /auth/password/reset`

#### Wallets
- `GET  /wallets`
- `POST /wallets`
- `PATCH /wallets/:id/disable`
- `PATCH /wallets/:id/enable` *(if implemented)*

#### Approvals feed
- `GET /approvals?chain=&kind=&minRisk=&skip=&take=`

#### Allowlist
- `GET    /allowlist?chain=`
- `POST   /allowlist`
- `DELETE /allowlist/:chain/:spender`

#### Settings (minimal, if implemented)
- `GET   /auth/me/settings`
- `PATCH /auth/me/settings`
- `POST  /auth/me/settings/test-email`

---

## Frontend (Client)

### Install & run
```bash
cd client
pnpm install
pnpm dev
```

Open:
- `http://localhost:3000`

### Client env
Create `client/.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:XXXX` *(backend base URL)*
- (optional) `NEXT_PUBLIC_APP_NAME=Wallet Hygiene Monitor`

> Client uses HTTP-only cookies for auth, so ensure `apiFetch` is configured with `credentials: 'include'`.

### Tech highlights
- Next.js App Router
- React Query (`@tanstack/react-query`) for API state
- Toast notifications (`react-hot-toast`)
- Simple dashboard layout and navigation

---

## How Monitoring Works (MVP)

1. User adds a wallet + chain.
2. Server sets wallet scan start block to “latest - backfillWindow”.
3. Scanner periodically polls latest blocks and fetches logs for relevant events.
4. Each event is scored (`riskScore`, `riskLevel`, `reasons[]`).
5. Email alerts are sent as a batch (limited by `EVENTS_PER_EMAIL_LIMIT`).

---

## Notes & Limitations (MVP)

- Email only (SMTP). No Telegram yet.
- No notification outbox/dedup/retry logic in MVP.
- Approvals “revoke” events (allowance=0 / ApprovalForAll=false) may be filtered depending on your risk logic.
- RPC providers may impose log range limits; batching/rate control can be added in later versions.

---

## Roadmap (Next)
- Telegram bot + commands (/wallets, /mute, /threshold)
- Notifications outbox table + retries/backoff + dedup keys
- Weekly digest / PDF export
- Token metadata (symbol/decimals) and normalized “human values”
- Better UX: event details page, revoke guides per chain, saved views

---

## License
MIT (or specify your preferred license).
