# Download & Deploy — TruckControl v2.4.0 (Full Production)

This is the **complete** Truck Turnaround & Operations Control System with all FMS features, bulk actions toolbar, and soft delete.

### Docker deploy (important)

After updating the ZIP or pulling from GitHub, **rebuild** the Docker image:

```bash
docker compose down
docker compose up -d --build
```

---

## Option 1 — Use the ZIP in this package

If you received `TruckControl-Production-v2.4.0-production.zip`:

```bash
unzip TruckControl-Production-v2.4.0-production.zip
cd TruckControl-Production-v2.4.0-production
cp .env.example .env
# Edit .env — set JWT_SECRET (32+ random characters), RUN_SEED=true first time only
docker compose up -d --build
```

Open **http://your-server:3001** — Login: `super_admin` / `ChangeMe123!`

Set `RUN_SEED=false` in `.env` and restart after first deploy.

---

## Option 2 — Build ZIP from source

```bash
git clone https://github.com/bellylukie-hub/Cursor-Project.git
cd Cursor-Project
git checkout cursor/bulk-delete-toolbar-42ca   # or main when merged

chmod +x scripts/build-production-zip.sh
./scripts/build-production-zip.sh v2.4.0-production
# Output: dist/TruckControl-Production-v2.4.0-production.zip
```

---

## Option 3 — Clone and run without ZIP

```bash
git clone https://github.com/bellylukie-hub/Cursor-Project.git
cd Cursor-Project
cp .env.example .env
docker compose up -d --build
```

---

## Deploy on a public domain (HTTPS)

1. Run the app on a VPS with Docker (steps above).
2. Point your domain **A record** to the server IP.
3. Install **Caddy** or **nginx + Certbot** reverse proxy to `localhost:3001`.
4. Set `CORS_ORIGIN=https://your-domain.com` in `.env`.

See `docs/images/domain-deployment.svg` and **docs/INSTALLATION.md §12**.

---

## What's included in v2.4.0

| Module | Features |
|--------|----------|
| **Operations** | NB/SB, Border, POD, Position Live, **bulk actions toolbar**, **soft delete** |
| **Client Orders** | Full FMS order form, filters, allocation |
| **Clients** | Client register (CRM) |
| **Route Catalog** | Stations, routes, templates |
| **Trip Scheduler** | Fleet set + client orders |
| **Fleet Registry** | Trucks, trailers, drivers, superlink |
| **Admin** | Users, roles, KPI, themes, Freight & FMS Settings |
| **Help** | In-app assistant, **COMPLETE-MANUAL** with illustrations |

---

## Server requirements

- **Docker:** Docker Engine 24+ or Docker Desktop (recommended)
- **Manual:** Node.js 20+, npm
- **Port:** 3001 internal (use 80/443 via reverse proxy for domain)
- **Disk:** ~500 MB + database growth

See **PRODUCTION.md** and **docs/INSTALLATION.md** for Linux server, PM2, WAMP, and security.

---

## Documentation in the ZIP

| File | Purpose |
|------|---------|
| `docs/COMPLETE-MANUAL.md` | Full illustrated user + admin book |
| `docs/USER-GUIDE.md` | Shorter daily operations guide |
| `docs/INSTALLATION.md` | Docker, domain, HTTPS, PM2 |
| `docs/images/*.svg` | Workflow and UI illustrations |
| `START-HERE.txt` | One-page quick start |
