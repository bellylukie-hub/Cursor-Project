# AGENTS.md

## Cursor Cloud specific instructions

TruckControl is a single Node.js + Express service (`backend/src/index.js`) that serves both the static web UI (`index.html`, `app.js`, `api.js`, `live-operations.js` at the repo root) and the REST API on one port (default `3001`). Data is stored in SQLite via `better-sqlite3`. All Node dependencies live in `backend/` only — there is no root `package.json`.

Standard commands are documented in `README.md` and `PRODUCTION.md`; `backend/package.json` holds the scripts (`start`, `dev`, `seed`, `seed:users`). Notes below are the non-obvious gotchas.

### Running (dev)
- The server reads configuration from `process.env` only (`backend/src/config/env.js`); it does **not** auto-load the root `.env`. Load it yourself before starting, e.g. `set -a && source .env && set +a`. `pm2-start.sh` already does this; `npm run dev` / `npm start` do not.
- A root `.env` (gitignored) is required for a realistic run. Minimum: set `JWT_SECRET`. For local work without login, set `REQUIRE_AUTH=false` (enables a role switcher and `X-User-Id`/`X-Username` header auth). With `REQUIRE_AUTH=true`, log in through the UI or `POST /api/auth/login`.
- `DATA_DIR` and `UPLOADS_DIR` default to `backend/data` and `backend/uploads`. When starting from the repo root, export absolute paths (e.g. `DATA_DIR="$PWD/backend/data"`) so the DB location is predictable.
- Dev entry point: `cd backend && npm run dev` (uses `node --watch`). App is then at `http://localhost:3001`.

### Seeding
- `cd backend && npm run seed` loads full demo trips + users and **clears existing operational tables first**. `npm run seed:users` only ensures roles/users exist (non-destructive). Seeded users all use password `ChangeMe123!` (or `DEFAULT_ADMIN_PASSWORD`); `super_admin` is the Super Admin.

### Lint / tests / build
- There is no lint config and no automated test suite in this repo, and no build step (the frontend is plain static files). "Running" the service is the primary verification path.

### UI login note
- When logging in via the browser form, Chrome may pop a "Save password?" dialog over the form — dismiss it (Escape / "Never") before clicking "Sign in". The plain form submit works; no console/API workaround is needed.
