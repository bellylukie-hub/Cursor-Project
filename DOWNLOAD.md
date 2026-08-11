# Download & Deploy — TruckControl v2.5.9 (Full Production)

This is the **complete** Truck Turnaround & Operations Control System with **all development features merged** into one package — operations, FMS, admin tools, internal communication, and the **illustrated User Manual**.

### Direct download (latest)

**GitHub release:** [v2.5.9-full-production](https://github.com/bellylukie-hub/Cursor-Project/releases/tag/v2.5.9-full-production)

File: `TruckControl-Production-v2.5.9-full-production.zip`

### Docker deploy (important)

After updating the ZIP or pulling from GitHub, **rebuild** the Docker image:

```bash
docker compose down
docker compose up -d --build
```

---

## Option 1 — Use the ZIP download

```bash
unzip TruckControl-Production-v2.5.9-full-production.zip
cd TruckControl-Production-v2.5.9-full-production
cp .env.example .env
# Edit .env — set JWT_SECRET (32+ random characters), RUN_SEED=true first time only
docker compose up -d --build
```

Open **http://your-server:3001** — Login: `super_admin` / `ChangeMe123!`

Set `RUN_SEED=false` in `.env` and restart after first deploy.

**Super Admin only:** Database Browser, Query Developer, and the Development sidebar section appear only when logged in as `super_admin`.

---

## Option 2 — Build ZIP from source

```bash
git clone https://github.com/bellylukie-hub/Cursor-Project.git
cd Cursor-Project
git checkout cursor/full-production-release-42ca   # or main when merged

chmod +x scripts/build-production-zip.sh scripts/verify-production-package.sh
./scripts/build-production-zip.sh v2.5.9-full-production
# Output: dist/TruckControl-Production-v2.5.8-full-production.zip
```

---

## Option 3 — Clone and run without ZIP

```bash
git clone https://github.com/bellylukie-hub/Cursor-Project.git
cd Cursor-Project
git checkout cursor/full-production-release-42ca
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

## What's included in v2.5.9

| Module | Features |
|--------|----------|
| **Internal comm** | **Email to all system users**; **chat user list**; **group chat with checkboxes**; trip/truck/trailer tags in chat |
| **Theme** | **Ocean Blue** default (not forced black) |
| **Operations** | NB/SB, Border, POD, Position Live, bulk actions, soft delete, area assignment |
| **FMS** | Client Orders, Clients, Route Catalog, Trip Scheduler, Fleet Registry |
| **Communication** | Driver registry, matrix, internal email/chat (server delivery), helpdesk |
| **Admin** | Users, roles, KPI, themes, Database Browser, Query Developer |
| **UI / UX** | Theme picker, auto-hide menu, global search, blank-screen login fix |

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
| `docs/images/*.svg` | Workflow and UI illustrations (including internal email & chat) |
| `START-HERE.txt` | One-page quick start |

**User Manual highlights:** open `docs/COMPLETE-MANUAL.md` after extracting the ZIP — includes login, every menu, bulk actions, helpdesk, internal communication (email + chat), and admin setup with diagrams.
