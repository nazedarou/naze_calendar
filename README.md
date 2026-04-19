# Fonk Dashboard

Interior-design scheduling + contracts app. Internal-only (login required) — the
company owner has full permissions; employees have role-gated access.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** + **Prisma**
- **Auth.js (NextAuth v5)** with credentials login + role-based access
- **bcrypt** for password hashing
- **zod** for input validation
- **googleapis** + **date-fns-tz** for Google Calendar sync (timezone: Asia/Singapore)

## Features

- Role-based auth: `OWNER` (full access) vs `EMPLOYEE`
- Clients directory (CRUD)
- Contracts with a **5-stage progressive payment schedule** per contract
  - Stage 1 (Design Fee): user-entered amount
  - Stages 2–5 auto-calculated as fixed percentages of the contract total:
    50% → 35% → 10% → 5%
  - Default labels: Design Fee, Commence Work, Carpentry, Carpentry Complete,
    Project Complete
  - Each milestone has its own label, amount, due date, payment notes, and
    paid/unpaid state
  - Overdue status computed at read-time
- Project cost tracking per contract (materials, subcontractors, etc.) for
  gross profit calculation
- Monthly calendar view of events, tied to clients + contracts
- Owner-only employee management (invite, reset password, activate, promote)
- Dashboard: upcoming events, overdue payments, revenue metrics (owner-only)
- **Google Calendar sync** — calendar events and payment due dates sync to
  connected users' Google Calendars via OAuth2

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
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth2 credentials for
  Calendar integration (optional; users connect individually via their profile)

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

| Command              | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Start the Next.js dev server                        |
| `npm run build`      | Production build (runs `prisma generate` first)     |
| `npm run start`      | Start production server                             |
| `npm run typecheck`  | Run TypeScript without emitting                     |
| `npm run db:push`    | Sync Prisma schema to the database                  |
| `npm run db:migrate` | Create a new Prisma migration                       |
| `npm run db:seed`    | Upsert the OWNER account from `.env`                |
| `npm run db:studio`  | Open Prisma Studio                                  |

## Data model (summary)

- **User** — login account, `OWNER | EMPLOYEE`; optionally stores a
  `googleRefreshToken` for Calendar sync
- **Client** — company / individual the firm works with
- **Contract** — belongs to a Client, has a total amount, status, start date,
  and assigned employees
- **PaymentMilestone** — 5 per contract (`stage` 1–5), each with label, amount,
  due date, paid date, notes, and paid/pending state
- **ProjectCost** — expense line items against a contract (used for gross profit)
- **Event** — calendar item, optionally linked to Client + Contract, with
  assigned staff
- **ContractAssignment / EventAssignment** — bridge tables linking Users to
  Contracts / Events; `EventAssignment` also stores the Google Calendar event ID
  per assignee
- **MilestoneSync / EventOwnerSync** — store Google Calendar event IDs for
  milestone due-date events and owner-level event syncs

## Permissions

| Capability                                    | OWNER | EMPLOYEE |
| --------------------------------------------- | :---: | :------: |
| View all clients                              |   ✓   |    ✓     |
| View all contracts / events                   |   ✓   |    —     |
| View assigned contracts / events              |   ✓   |    ✓     |
| Create clients / contracts / events           |   ✓   |    ✓     |
| Edit clients / contracts / events             |   ✓   |    ✓     |
| Mark payments paid/unpaid, set due dates      |   ✓   |    ✓     |
| Delete clients / contracts / events           |   ✓   |    —     |
| View revenue metrics & gross profit           |   ✓   |    —     |
| Manage employee accounts                      |   ✓   |    —     |

## Deploy notes

- Set `AUTH_SECRET`, `AUTH_URL`, `DATABASE_URL`, and the `OWNER_*` vars in your
  hosting provider
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if Google Calendar sync is
  needed
- Run `npm run db:push` (or `prisma migrate deploy` once you've adopted
  migrations) + `npm run db:seed` on first deploy
- Vercel, Fly.io, Railway, and Render all work with this stack; you just need a
  PostgreSQL database
