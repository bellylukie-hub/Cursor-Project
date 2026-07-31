# Truck Turnaround & Operations Control System

Production-ready web app for DRC truck operations: NB/SB workflows, border clearance (KBP, Whisky, Sakania, Mokambo), POD, turnarounds, runner fees, and admin RBAC.

## Clone from GitHub

```bash
git clone https://github.com/bellylukie-hub/Cursor-Project.git
cd Cursor-Project
```

## Production quick start

### Option A — PM2 (run 24/7 on your computer)

```bash
cp .env.example .env
# Edit .env: set JWT_SECRET, keep RUN_SEED=false after first setup

cd backend && npm ci && cd ..
chmod +x pm2-start.sh
npm install -g pm2

# First time only (optional demo data):
# cd backend && npm run seed && cd ..

pm2 start ecosystem.config.cjs
pm2 save
```

Open **http://localhost:3001** — sign in with `super_admin` / `ChangeMe123!`

### Option B — Docker

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET, RUN_SEED=false after first deploy

docker compose up -d --build
```

### Option C — Manual

```bash
cd backend
npm ci
cp ../.env.example ../.env   # edit JWT_SECRET
export NODE_ENV=production REQUIRE_AUTH=true
# load vars from ../.env or export manually
npm run seed    # first time only
npm start
```

Full details: [PRODUCTION.md](PRODUCTION.md)

## Default login (after seed)

| Username | Role |
|----------|------|
| `super_admin` | Super Admin |
| `ops_manager` | Manager |
| `border_moderator` | Moderator |
| `driver_user` | User |
| `kanyaka_dispatcher` | Moderator |

Password: `ChangeMe123!` (or `DEFAULT_ADMIN_PASSWORD` in `.env`)

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | `index.html`, `app.js`, `api.js`, `live-operations.js` |
| Backend | Node.js + Express + SQLite |
| Auth | JWT + PBKDF2 passwords |
| Deploy | Docker, PM2, or `npm start` |

## Key features

- **NB workflow:** Border → Kanyaka → Offloading → POD
- **SB workflow:** Loading → Documents → Seal → Escort → Dispatch → Kanyaka → Border exit
- **Live operations tables:** Full column template on NB, SB, Border, and Position Live pages
- **Column manager:** Show/hide columns and freeze pinned columns when scrolling (saved per page)
- **KPI color coordination:** On Track (green), Priority (orange), and Overdue (red) aligned across truck, status, KPI, and rows
- **Border driver registry:** Register NB drivers (WhatsApp + DRC number) from Communication or border tables
- **Admin:** Users, roles, KPI settings (per step + transitions), module permissions, audit logs
- **Operations:** Dashboard, border clearance, POD, assets, communications, runner fees, reports

## Windows setup (manual / PM2)

If you see `Cannot find module 'express'`, dependencies were not installed yet. From the project root:

```bat
cd backend
npm install
npm run seed
npm start
```

Open **http://localhost:3001**. For 24/7 hosting on Windows, use PM2 after `npm install -g pm2` — see [PRODUCTION.md](PRODUCTION.md).

## Project layout

```
├── index.html              # UI shell
├── app.js                  # Pages, demo data, admin
├── api.js                  # API client + JWT auth
├── live-operations.js      # Live ops tables
├── backend/
│   ├── src/index.js        # Express server (serves UI + API)
│   ├── src/routes/         # auth.js, api.js
│   ├── src/services/       # workflow, auth, turnarounds
│   └── data/               # SQLite (created at runtime)
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.cjs    # PM2
├── pm2-start.sh
├── .env.example
└── PRODUCTION.md
```

## API (authenticated)

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `POST /api/auth/login` | Login → JWT |
| `GET /api/trips` | All trips + workflow state |
| `POST /api/trips/upload-nb` | Upload NB trip |
| `POST /api/turnarounds/from-nb/:nb/create-sb` | Create SB from NB turnaround |

See `backend/src/routes/api.js` for the full API.
