# Fonk Dashboard

Interior-design scheduling + contracts app. Internal-only (login required) — the
company owner has full permissions; employees have role-gated access.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** + **Prisma**
- **Auth.js (NextAuth v5)** with credentials login + role-based access
- **bcrypt** for password hashing
- **zod** for input validation

## Features

- Role-based auth: `OWNER` (full access) vs `EMPLOYEE`
- Clients directory (CRUD)
- Contracts with a **4-stage progressive payment schedule** per contract
  - Default split: total ÷ 4, one stage per month from start date
  - Each milestone has its own label, amount, due date, and paid/unpaid state
  - Overdue status computed at read-time
- Monthly calendar view of events, tied to clients + contracts
- Owner-only employee management (invite, reset password, activate, promote)
- Dashboard: upcoming events, overdue payments, payments due in next 30 days

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env`:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `AUTH_URL` — e.g. `http://localhost:3000`
- `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_NAME` — seeded owner account (used by
  `prisma/seed.ts` on first run; **change the password immediately after first
  login**)

### 3. Initialize the database

```bash
npm run db:push     # push the Prisma schema to your database
npm run db:seed     # create the OWNER account from OWNER_EMAIL / OWNER_PASSWORD
```

### 4. Run the app

```bash
npm run dev
```

Open <http://localhost:3000> and sign in with your owner credentials.

## Common tasks

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Start the Next.js dev server                        |
| `npm run build`    | Production build (runs `prisma generate` first)     |
| `npm run start`    | Start production server                             |
| `npm run typecheck`| Run TypeScript without emitting                     |
| `npm run db:push`  | Sync Prisma schema to the database                  |
| `npm run db:migrate` | Create a new Prisma migration                     |
| `npm run db:seed`  | Upsert the OWNER account from `.env`                |
| `npm run db:studio`| Open Prisma Studio                                  |

## Data model (summary)

- **User** — login account, `OWNER | EMPLOYEE`
- **Client** — company / individual the firm works with
- **Contract** — belongs to a Client, has a total amount, status, date range,
  assigned employees
- **PaymentMilestone** — 4 per contract (`stage` 1–4), each with due date,
  amount, and paid/pending state
- **Event** — calendar item, optionally linked to Client + Contract, with
  assigned staff

## Permissions

| Capability                              | OWNER | EMPLOYEE |
| --------------------------------------- | :---: | :------: |
| View all clients / contracts / events   |   ✓   |    ✓     |
| Create clients / contracts / events     |   ✓   |    ✓     |
| Edit clients / contracts / events       |   ✓   |    ✓     |
| Mark payments paid/unpaid               |   ✓   |    ✓     |
| Delete clients / contracts / events     |   ✓   |    —     |
| Manage employee accounts                |   ✓   |    —     |

Further per-assignment restrictions (e.g., employees only see their assigned
contracts) can be layered on top of the `ContractAssignment` / `EventAssignment`
tables without schema changes.

## Deploy notes

- Set `AUTH_SECRET`, `AUTH_URL`, `DATABASE_URL`, and the `OWNER_*` vars in your
  hosting provider
- Run `npm run db:push` (or `prisma migrate deploy` once you've adopted
  migrations) + `npm run db:seed` on first deploy
- Vercel, Fly.io, Railway, and Render all work with this stack; you just need a
  PostgreSQL database
