# Catalyst Volunteers — Backend

Express + TypeScript API backed by Prisma and Supabase Postgres.

## Getting Started

1. Install dependencies: (automatically runs prisma generate for you)
   ```
   npm install
   ```
2. Create a `.env` file in the `backend/` root (see [Environment Variables](#environment-variables) below).
3. Start the dev server:
   ```
   npm run dev
   ```

## Scripts

| Script              | Command        | What it does                                                                                                                                                                 |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | `nodemon`      | Starts the dev server with auto-restart on file changes. Runs the TypeScript directly via `tsx` — no build step needed. This is what you'll use day to day.                  |
| `npm run typecheck` | `tsc --noEmit` | Type-checks the whole project without producing any output files. `dev` does **not** type-check (it just runs the code), so run this before committing to catch type errors. |
| `npm run compile`   | `tsc`          | Compiles the TypeScript in `src/` to JavaScript in `dist/`. Used for producing a real build, not needed for local development.                                               |
| `npm run test`      | `vitest`       | Runs the test suite. Tests mock the database, so they never touch Supabase — safe to run anytime.                                                                            |

## Database

We share a single Supabase database, and the schema is already applied — you do **not** need to run migrations after cloning. `npm install` generates the Prisma client for you.

If you change `prisma/schema.prisma`, coordinate with the team before running `npx prisma migrate dev` — it alters the shared database for everyone. One person runs it and commits the migration; everyone else just runs `npx prisma generate` to resync their client.

## Authentication

Most endpoints require a JWT. Get one from `POST /users/login`, then in Swagger click **Authorize** and paste the raw token (no `Bearer ` prefix — Swagger adds it).

## API Documentation (Swagger)

Interactive API docs are available at:

```
http://localhost:3000/api-docs
```

**The server must be running** (`npm run dev`) to view them — the docs are served by the app itself, so they aren't available as a static page. Once the server is up, open that URL in your browser to see all endpoints, request/response schemas, and a "Try it out" feature for testing routes live.

## A note on `/users/register`

This endpoint is intentionally left unauthenticated so the app can be evaluated
without seeding credentials.

In production this would be closed one of two ways: put `RequiresAuth` on the
route so administrators invite other administrators, or add a role to the user
model so self-registered accounts start without admin rights and must be promoted.
Either is a small change in `user.router.ts`.

## Environment Variables

Create a `.env` file in the `backend/` root with the following:

```dotenv
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only) — used by the app at runtime
DATABASE_URL="postgresql://<user>:<password>@<host>:6543/postgres?pgbouncer=true"

# Connect to Postgres via the shared session-mode pooler — used for Prisma migrations
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/postgres"

JWT_SECRET="random-long-string"
```

**The real values are pinned in our Discord server** — grab them there and paste them in. Do **not** commit your `.env`; this repo is public, but the credentials are not. `.env` is already in `.gitignore`.

A note on the two URLs: `DATABASE_URL` (port 6543) is the transaction pooler the running app uses, and `DIRECT_URL` (port 5432) is the session pooler Prisma needs for migrations. You need both set or migrations won't run.
