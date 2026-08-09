# Download & Deploy — TruckControl v2.0.0 (Full Production)

This is the **complete** Truck Turnaround & Operations Control System with all FMS features.

## Option 1 — Download ZIP (fastest)

1. Go to GitHub Releases:  
   **https://github.com/bellylukie-hub/Cursor-Project/releases/tag/v2.0.0-production**

2. Download **`TruckControl-Production-v2.0.0-production.zip`**

3. Extract on your server or PC, then:

```bash
cd TruckControl-Production-v2.0.0-production
cp .env.example .env
# Edit .env — set JWT_SECRET (32+ random characters), RUN_SEED=true first time only
docker compose up -d --build
```

4. Open **http://your-server:3001**  
   Login: `super_admin` / `ChangeMe123!`

5. Set `RUN_SEED=false` in `.env` and restart after first deploy.

---

## Option 2 — Clone from GitHub

```bash
git clone https://github.com/bellylukie-hub/Cursor-Project.git
cd Cursor-Project
git checkout v2.0.0-production

cp .env.example .env
# Edit JWT_SECRET in .env

cd backend && npm ci && cd ..
docker compose up -d --build
```

Or without Docker:

```bash
cd backend
npm ci
npm run seed    # first time only
npm start
```

---

## Option 3 — Build ZIP yourself from source

```bash
git clone https://github.com/bellylukie-hub/Cursor-Project.git
cd Cursor-Project
chmod +x scripts/build-production-zip.sh
./scripts/build-production-zip.sh v2.0.0-production
# Output: dist/TruckControl-Production-v2.0.0-production.zip
```

---

## What's included in v2.0.0

| Module | Features |
|--------|----------|
| **Operations** | NB/SB, Border, POD, Position Live, Turnarounds, Reports |
| **Client Orders** | Full FMS order form, filters, allocation |
| **Clients** | Client register (CRM) |
| **Route Catalog** | Stations, loading/offloading points, route templates |
| **Trip Scheduler** | Fleet set + client orders linked with auto-fill |
| **Fleet Registry** | Trucks, trailers, drivers, superlink, FMS register |
| **Admin** | Users, roles, KPI, themes, Freight & FMS Settings |
| **Help** | In-app assistant for all workflows |

---

## Server requirements

- **Docker:** Docker Engine 20+ or Docker Desktop (recommended)
- **Manual:** Node.js 18+ or 20+, npm
- **Port:** 3001 (configurable in `.env`)
- **Disk:** ~200 MB + SQLite data growth

See **PRODUCTION.md** and **docs/INSTALLATION.md** for Linux server, PM2, WAMP, and security hardening.
