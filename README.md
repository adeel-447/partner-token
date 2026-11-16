# Token POC

An npm workspaces monorepo with TypeScript throughout.

```text
apps/
  frontend/    Next.js App Router + Tailwind CSS (port 3000)
  backend/     NestJS REST API (port 4000)
tsconfig.base.json
```

## Requirements

Node.js 24 LTS (see `.nvmrc`) and npm 10 or newer.

## Getting started

Run these commands from `token_poc`:

```sh
npm install
npm run dev
```

Open http://localhost:3000 to view the wallet dashboard. The frontend loads wallet details and transaction history from the NestJS API.

Default settings work without environment files. To customize them:

```sh
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

`NEXT_PUBLIC_API_URL` is the backend API origin used by the browser (default `http://localhost:4000/api`). `PORT` sets the backend port, and `FRONTEND_URL` sets its allowed browser CORS origin. If you change the backend port, update the API URL to match. Restart development servers after changing environment values.

## Wallet API

- `GET /api/wallet` returns the demo user's name and token balance.
- `GET /api/transactions` returns the newest transactions first.
- `POST /api/wallet/credit` with `{ "amount": 500, "description": "Token Purchase" }` and a UUID `Idempotency-Key` header adds tokens.
- `POST /api/wallet/redeem` with `{ "amount": 300, "description": "Token Redemption" }` and a UUID `Idempotency-Key` header redeems tokens.

Amounts must be positive whole numbers. Reuse the same idempotency key for retries; a key used with different operation data returns `409 Conflict`. Keys, request fingerprints, and the original response balance are stored on ledger records, so duplicate responses survive restarts. The wallet and ledger are stored under `apps/backend/data/` and are initialized only when their files are missing. Each wallet update stages and validates both new JSON files, records the previous contents in `transaction-journal.json`, then replaces the files and marks the journal committed. Startup restores the previous contents from an unfinished journal. Wallet operations are serialized in-process. This JSON approach provides reasonable recovery for the single-process demo, not database-level ACID guarantees: sudden filesystem or device failure, unsupported rename behavior, or multiple backend instances can still cause problems. Use a transactional database for production.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start both apps with watch mode |
| `npm run dev:frontend` | Start only Next.js |
| `npm run dev:backend` | Start only NestJS |
| `npm run lint` | Lint both apps |
| `npm run typecheck` | Check TypeScript in both apps |
| `npm test --workspace=@token-poc/backend` | Run backend transaction and recovery tests |
| `npm run build` | Build both apps for production |
| `npm start` | Start both production apps after building |

Install dependencies from this directory using `npm install <package> --workspace=@token-poc/frontend` or `--workspace=@token-poc/backend`. Commit the root `package-lock.json`; use `npm ci` for reproducible installs in CI.

The root dependency override selects a patched `minimatch` for TypeScript ESLint (GHSA-g3hv-75wg-m249). Remove it when TypeScript ESLint includes the patched dependency itself.

Framework references: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [NestJS](https://docs.nestjs.com/first-steps), [Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs).
