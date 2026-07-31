# Server Deployment Guide

Full production build — JWT auth, live operations tables, column manager, KPI colors, driver registry.

**Repository:** https://github.com/bellylukie-hub/Cursor-Project  
**Branch:** `main`  
**Release tag:** `v1.1.0-production`

---

## Option 1 — Download ZIP (no Git required)

1. Open: https://github.com/bellylukie-hub/Cursor-Project/archive/refs/tags/v1.1.0-production.zip  
2. Extract on your server (e.g. `/opt/truckcontrol`)
3. Follow **Docker** or **Manual** steps below

---

## Option 2 — Clone with Git (recommended for updates)

```bash
git clone https://github.com/bellylukie-hub/Cursor-Project.git
cd Cursor-Project
git checkout v1.1.0-production
```

---

## Docker deploy (recommended for Linux servers)

```bash
cp .env.example .env
nano .env   # set JWT_SECRET, RUN_SEED=true for first run only

docker compose up -d --build
docker compose logs -f
```

Open **http://YOUR_SERVER_IP:3001**

After first login, edit `.env` → `RUN_SEED=false`, then:

```bash
docker compose up -d
```

---

## Manual deploy (Node.js on server)

```bash
# Install Node.js 20+ if needed
cd Cursor-Project
cp .env.example .env
nano .env   # JWT_SECRET required

cd backend
npm ci
npm run seed    # first time only
NODE_ENV=production REQUIRE_AUTH=true npm start
```

Use **PM2** for 24/7:

```bash
npm install -g pm2
cd /path/to/Cursor-Project
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## Default login (after seed)

| Username | Password |
|----------|----------|
| `super_admin` | `ChangeMe123!` |

Change passwords after first login. Set `DEFAULT_ADMIN_PASSWORD` in `.env` before seeding if you prefer a custom default.

---

## Firewall

Allow inbound TCP on port **3001** (or your `PORT` in `.env`).

For production, put **nginx** or **Caddy** in front for HTTPS.

---

## Backup

Back up:

- `backend/data/truckcontrol.db` (or Docker volume `truckcontrol-data`)
- `backend/uploads/` (or volume `truckcontrol-uploads`)

---

## Health check

```bash
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok","service":"truckcontrol-api",...}`
