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

## API Documentation (Swagger)

Interactive API docs are available at:

```
http://localhost:3000/api-docs
```

**The server must be running** (`npm run dev`) to view them — the docs are served by the app itself, so they aren't available as a static page. Once the server is up, open that URL in your browser to see all endpoints, request/response schemas, and a "Try it out" feature for testing routes live.

## Environment Variables

Create a `.env` file in the `backend/` root with the following:

```dotenv
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only) — used by the app at runtime
DATABASE_URL="postgresql://<user>:<password>@<host>:6543/postgres?pgbouncer=true"

# Connect to Postgres via the shared session-mode pooler — used for Prisma migrations
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/postgres"
```

**The real values are pinned in our Discord server** — grab them there and paste them in. Do **not** commit your `.env`; this repo is public, but the credentials are not. `.env` is already in `.gitignore`.

A note on the two URLs: `DATABASE_URL` (port 6543) is the transaction pooler the running app uses, and `DIRECT_URL` (port 5432) is the session pooler Prisma needs for migrations. You need both set or migrations won't run.
