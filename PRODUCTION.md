# TruckControl — Production Deployment

## Overview

TruckControl runs as a single Node.js service that serves the web UI and REST API on one port. SQLite stores operational data; JWT secures all `/api/*` routes except `/api/health` and `/api/auth/login`.

## Quick start (Docker)

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET to a strong random value

docker compose up -d --build
```

Open **http://localhost:3001** and sign in:

| Username | Role |
|----------|------|
| `super_admin` | Super Admin |
| `ops_manager` | Manager |
| `border_moderator` | Moderator |
| `driver_user` | User |
| `kanyaka_dispatcher` | Moderator |

Default password: `ChangeMe123!` (or `DEFAULT_ADMIN_PASSWORD` from `.env`).

After the first successful deploy, set `RUN_SEED=false` in `.env` so restarts do not reload demo trip data.

## Run 24/7 on your computer (PM2, no Docker)

Use this when you want the app to keep running after you close Cursor or your terminal.

### 1. One-time setup

```bash
# From the project root (folder that contains backend/, app.js, .env)
cd /path/to/your/TruckControl-repo

cp .env.example .env
# Edit .env — set JWT_SECRET and confirm RUN_SEED=false

cd backend
npm ci
cd ..

# First time only — load demo data + users once (optional)
# cd backend && npm run seed && cd ..

chmod +x pm2-start.sh

# Install PM2 globally (once per machine)
npm install -g pm2
```

### 2. Start and keep running

```bash
cd /path/to/your/TruckControl-repo
pm2 start ecosystem.config.cjs
pm2 save
```

`pm2 save` remembers the process list so it can come back after reboot.

### 3. Start automatically after reboot (optional)

```bash
pm2 startup
```

Run the command PM2 prints (it may ask for your password). Then:

```bash
pm2 save
```

### 4. Useful PM2 commands

```bash
pm2 status              # is it running?
pm2 logs truckcontrol   # live logs
pm2 restart truckcontrol
pm2 stop truckcontrol
pm2 delete truckcontrol
```

Open **http://localhost:3001** (or your `PORT` from `.env`).

### RUN_SEED and demo data

- `RUN_SEED=true` in `.env` reloads demo trips every time the app **starts** (Docker or `pm2-start.sh`).
- `RUN_SEED=false` only ensures users/roles exist; **does not** wipe or reload demo trips.
- To load demo data once manually: `cd backend && npm run seed`

## Manual deployment (no Docker)

```bash
cd backend
npm ci
export NODE_ENV=production
export REQUIRE_AUTH=true
export JWT_SECRET="your-long-random-secret"
export DATA_DIR="$(pwd)/data"
export UPLOADS_DIR="$(pwd)/uploads"
npm run seed    # first time only
npm start
```

Visit **http://localhost:3001**.

### Development mode

For local work without login:

```bash
export REQUIRE_AUTH=false
npm start
```

The UI shows the role switcher and accepts `X-User-Id` / `X-Username` headers for API calls.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `NODE_ENV` | `development` | Set to `production` in live environments |
| `REQUIRE_AUTH` | `true` | `false` disables JWT (dev only) |
| `JWT_SECRET` | dev placeholder | **Required** in production |
| `JWT_EXPIRES_IN` | `12h` | Token lifetime (`1h`, `30m`, `7d`, etc.) |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins |
| `DATA_DIR` | `backend/data` | SQLite database directory |
| `UPLOADS_DIR` | `backend/uploads` | Uploaded files |
| `DEFAULT_ADMIN_PASSWORD` | `ChangeMe123!` | Seeded user passwords |
| `RUN_SEED` | `false` (manual) / `true` (Docker) | Full demo seed on container start |

## Security checklist

1. Set a strong `JWT_SECRET` (32+ random characters).
2. Change default user passwords after first login.
3. Set `RUN_SEED=false` after initial setup.
4. Put HTTPS in front of the app (nginx, Caddy, or a cloud load balancer).
5. Restrict `CORS_ORIGIN` to your domain in production.
6. Back up the `DATA_DIR` volume regularly (`truckcontrol.db`).

## API authentication

```bash
# Login
curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"super_admin","password":"ChangeMe123!"}'

# Use returned token
curl -s http://localhost:3001/api/trips \
  -H "Authorization: Bearer <token>"
```

## Data persistence

Docker Compose mounts:

- `truckcontrol-data` → `/data` (SQLite)
- `truckcontrol-uploads` → `/uploads` (file uploads)

## Health check

```bash
curl http://localhost:3001/api/health
```

Returns `requireAuth: true` when JWT is enforced.
