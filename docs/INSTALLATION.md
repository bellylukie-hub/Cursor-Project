# TruckControl — Master Installation Guide

**Version:** v1.2.0-production  
**Default port:** `3001` (web UI + REST API on one port)

This guide covers every supported way to install and run TruckControl: Docker, WAMP (Windows), Linux server, manual Node.js, PM2, XAMPP/LAMP as reverse proxy, and nginx/Caddy for HTTPS.

---

## Table of contents

1. [Before you begin](#1-before-you-begin)
2. [Package contents](#2-package-contents)
3. [Quick start (any platform)](#3-quick-start-any-platform)
4. [Docker — all platforms](#4-docker--all-platforms)
5. [Windows + WAMP + Docker](#5-windows--wamp--docker)
6. [Linux server (Docker)](#6-linux-server-docker)
7. [Linux server (manual Node.js)](#7-linux-server-manual-nodejs)
8. [Windows manual (no Docker)](#8-windows-manual-no-docker)
9. [macOS](#9-macos)
10. [PM2 — run 24/7](#10-pm2--run-247)
11. [XAMPP / LAMP / Apache reverse proxy](#11-xampp--lamp--apache-reverse-proxy)
12. [nginx / Caddy — HTTPS](#12-nginx--caddy--https)
13. [Environment variables](#13-environment-variables)
14. [First login and seed data](#14-first-login-and-seed-data)
15. [Backup and restore](#15-backup-and-restore)
16. [Updates](#16-updates)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Before you begin

### System requirements

| Component | Requirement |
|-----------|-------------|
| **CPU / RAM** | 1 vCPU, 1 GB RAM minimum; 2 GB+ recommended for production |
| **Disk** | 500 MB for app; grow for database and uploads |
| **Node.js** (manual install) | **20.x or newer** LTS |
| **Docker** (container install) | Docker Engine 24+ and Docker Compose v2 |
| **Network** | Inbound TCP on your chosen port (default **3001**) |

### Important: WAMP / XAMPP / LAMP and MySQL

TruckControl is a **Node.js** application. It does **not** run inside PHP or Apache directly.

| Technology | Used by TruckControl? |
|------------|----------------------|
| Node.js | **Yes** — required (or Docker image includes it) |
| SQLite | **Yes** — embedded database |
| MySQL / MariaDB (WAMP) | **No** — not required |
| PHP (WAMP) | **No** — not required |
| Apache / nginx | **Optional** — reverse proxy only |

You may use WAMP or XAMPP **only as a front door** on port 80/443 proxying to TruckControl on port 3001.

---

## 2. Package contents

After extracting `TruckControl-Production-v1.2.0-production.zip`:

```
TruckControl-Production-v1.2.0-production/
├── START-HERE.txt              ← read this first
├── docs/
│   ├── README.md               ← documentation index
│   ├── USER-GUIDE.md           ← end-user manual
│   └── INSTALLATION.md         ← this file
├── index.html, app.js, api.js, live-operations.js, ...
├── backend/                    ← Node.js API + SQLite
├── samples/                    ← CSV upload templates
├── docker-compose.yml, Dockerfile
├── ecosystem.config.cjs        ← PM2
├── install-docker.sh, install-linux.sh, pm2-start.sh
├── .env.example
└── README.md, PRODUCTION.md, DEPLOY.md, INSTALL-*.md
```

---

## 3. Quick start (any platform)

```bash
# 1. Extract ZIP
unzip TruckControl-Production-v1.2.0-production.zip
cd TruckControl-Production-v1.2.0-production

# 2. Configure
cp .env.example .env
# Edit .env — set JWT_SECRET (required, 32+ random characters)

# 3. Start with Docker (recommended)
docker compose up -d --build

# 4. Open browser
# http://localhost:3001
# Login: super_admin / ChangeMe123!
```

After first successful login, set `RUN_SEED=false` in `.env` and restart.

---

## 4. Docker — all platforms

Works on **Windows** (Docker Desktop), **Linux**, and **macOS**.

### Step 1 — Install Docker

- **Windows:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) — start it and wait until "Running".
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  # log out and back in
  ```
- **macOS:** Docker Desktop from docker.com.

### Step 2 — Configure

```bash
cd /path/to/TruckControl-Production-v1.2.0-production
cp .env.example .env
```

Edit `.env`:

```env
JWT_SECRET=your-long-random-secret-at-least-32-characters
RUN_SEED=true
PORT=3001
```

`RUN_SEED=true` loads demo users and sample trips on **first start only** — set `false` after you confirm login works.

### Step 3 — Build and run

```bash
docker compose up -d --build
docker compose logs -f
```

Or use the helper script (Linux/macOS):

```bash
chmod +x install-docker.sh
./install-docker.sh
```

### Step 4 — Verify

```bash
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok","service":"truckcontrol-api",...}`

Open **http://localhost:3001** in a browser.

### Docker commands reference

```bash
docker compose ps              # status
docker compose logs -f         # live logs
docker compose restart         # restart
docker compose down            # stop
docker compose up -d --build   # rebuild after update
```

### Data volumes

Docker Compose creates:

- `truckcontrol-data` → SQLite database
- `truckcontrol-uploads` → uploaded files

---

## 5. Windows + WAMP + Docker

**Recommended setup for Windows Server with WAMP installed.**

### Architecture

```
Browser → Docker (port 3001) → TruckControl
Optional: Browser → WAMP Apache (port 80) → proxy → port 3001
```

### Steps

1. Install and start **Docker Desktop**.
2. Extract the production ZIP to e.g. `C:\TruckControl-Production-v1.2.0-production`.
3. In **Command Prompt** or **PowerShell**:

```bat
cd C:\TruckControl-Production-v1.2.0-production
copy .env.example .env
notepad .env
```

Set `JWT_SECRET` and `RUN_SEED=true` for first install.

```bat
docker compose up -d --build
```

4. Open **http://localhost:3001**
5. Allow **TCP 3001** in Windows Defender Firewall for LAN access.
6. From another PC: **http://YOUR_SERVER_IP:3001**

### Optional: WAMP Apache reverse proxy

If you want `http://your-server/truckcontrol` instead of `:3001`:

1. WAMP tray → **Apache** → **Apache modules** → enable `proxy`, `proxy_http`.
2. Add to Apache config:

```apache
ProxyPreserveHost On
ProxyPass /truckcontrol http://127.0.0.1:3001/
ProxyPassReverse /truckcontrol http://127.0.0.1:3001/
```

3. Restart Apache.
4. If API calls fail through proxy, set in `.env`:
   ```env
   CORS_ORIGIN=http://localhost
   ```
   Then `docker compose up -d`.

See also: [INSTALL-WAMP-DOCKER.md](../INSTALL-WAMP-DOCKER.md)

---

## 6. Linux server (Docker)

```bash
# Upload ZIP to server
scp TruckControl-Production-v1.2.0-production.zip user@server:/opt/
ssh user@server

cd /opt
unzip TruckControl-Production-v1.2.0-production.zip
cd TruckControl-Production-v1.2.0-production

cp .env.example .env
nano .env   # JWT_SECRET, RUN_SEED=true for first run

chmod +x install-docker.sh
./install-docker.sh

# Firewall
sudo ufw allow 3001/tcp
```

Open **http://YOUR_SERVER_IP:3001**

See also: [INSTALL-SERVER.md](../INSTALL-SERVER.md)

---

## 7. Linux server (manual Node.js)

When Docker is not available:

```bash
# Install Node.js 20+ (Ubuntu example)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

cd TruckControl-Production-v1.2.0-production
chmod +x install-linux.sh
./install-linux.sh
```

Or manually:

```bash
cp .env.example .env
nano .env

cd backend
npm ci
npm run seed    # first time only
export NODE_ENV=production REQUIRE_AUTH=true
npm start
```

For production, use PM2 (next section).

---

## 8. Windows manual (no Docker)

Requires [Node.js 20+](https://nodejs.org/) installed.

```bat
cd C:\TruckControl-Production-v1.2.0-production
copy .env.example .env
notepad .env

cd backend
npm install
npm run seed
npm start
```

Open **http://localhost:3001**

If you see `Cannot find module 'express'`, run `npm install` inside the `backend` folder.

For 24/7 on Windows:

```bat
npm install -g pm2
cd C:\TruckControl-Production-v1.2.0-production
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 9. macOS

**Docker (recommended):** same as [Section 4](#4-docker--all-platforms).

**Manual:**

```bash
brew install node@20
cd TruckControl-Production-v1.2.0-production
cp .env.example .env
cd backend && npm ci && npm run seed && npm start
```

---

## 10. PM2 — run 24/7

Use PM2 when the app must keep running after you close the terminal (Linux, Windows, macOS).

```bash
npm install -g pm2

cd /path/to/TruckControl-Production-v1.2.0-production
cp .env.example .env
# edit JWT_SECRET, RUN_SEED=false after first setup

cd backend && npm ci && cd ..
chmod +x pm2-start.sh

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # follow printed command for boot auto-start
pm2 save
```

Useful commands:

```bash
pm2 status
pm2 logs truckcontrol
pm2 restart truckcontrol
pm2 stop truckcontrol
```

See [PRODUCTION.md](../PRODUCTION.md) for full PM2 reference.

---

## 11. XAMPP / LAMP / Apache reverse proxy

Same pattern as WAMP: Apache does **not** run the app; it proxies to Node on 3001.

1. Start TruckControl (Docker or `npm start`) on port **3001**.
2. Enable Apache modules: `proxy`, `proxy_http`.
3. Example virtual host:

```apache
<VirtualHost *:80>
    ServerName truckcontrol.local
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/
</VirtualHost>
```

4. Set `CORS_ORIGIN` to your public URL if needed.

**XAMPP (Windows):** edit `httpd-vhosts.conf` in the XAMPP Apache config folder.

**LAMP (Linux):** enable site in `/etc/apache2/sites-available/`.

---

## 12. nginx / Caddy — HTTPS

Put HTTPS in front of TruckControl for production.

### nginx example

```nginx
server {
    listen 443 ssl;
    server_name truckcontrol.example.com;

    ssl_certificate     /etc/ssl/certs/truckcontrol.crt;
    ssl_certificate_key /etc/ssl/private/truckcontrol.key;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

In `.env`:

```env
CORS_ORIGIN=https://truckcontrol.example.com
```

### Caddy example

```
truckcontrol.example.com {
    reverse_proxy localhost:3001
}
```

Caddy obtains Let's Encrypt certificates automatically.

---

## 13. Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `NODE_ENV` | `development` | Set `production` in live environments |
| `REQUIRE_AUTH` | `true` | `false` = dev mode without login |
| `JWT_SECRET` | (dev placeholder) | **Required** in production — 32+ random chars |
| `JWT_EXPIRES_IN` | `12h` | Token lifetime |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins |
| `DATA_DIR` | `backend/data` | SQLite directory |
| `UPLOADS_DIR` | `backend/uploads` | Upload storage |
| `DEFAULT_ADMIN_PASSWORD` | `ChangeMe123!` | Password for seeded users |
| `RUN_SEED` | `false` / `true` in Docker | Reload demo data on each start if `true` |

Copy from `.env.example` and never commit `.env` to version control.

---

## 14. First login and seed data

| Username | Password | Role |
|----------|----------|------|
| `super_admin` | `ChangeMe123!` | Super Admin |
| `ops_manager` | `ChangeMe123!` | Manager |
| `border_moderator` | `ChangeMe123!` | Moderator |
| `driver_user` | `ChangeMe123!` | User |

**After first login:**

1. Change passwords (Admin → Manage Users).
2. Set `RUN_SEED=false` in `.env`.
3. Restart: `docker compose up -d` or `pm2 restart truckcontrol`.

**Test uploads:**

1. NB Operations → Upload NB Live File → use `samples/NB_Live_Template.csv`
2. SB Operations → Upload SB Live File → use `samples/SB_Live_Template.csv`
3. Position Live → upload position file (3× daily slots)

---

## 15. Backup and restore

### Docker

```bash
# List volumes
docker volume ls | grep truckcontrol

# Backup database (example)
docker compose exec truckcontrol cat /data/truckcontrol.db > backup-$(date +%F).db
```

Also back up volume `truckcontrol-uploads`.

### Manual / PM2

- Database: `backend/data/truckcontrol.db`
- Uploads: `backend/uploads/`

Schedule daily copies to secure storage.

---

## 16. Updates

```bash
# 1. Backup database and uploads
# 2. Stop app
docker compose down
# or: pm2 stop truckcontrol

# 3. Extract new ZIP (keep your .env file)
# 4. Rebuild
docker compose up -d --build
# or: pm2 restart truckcontrol
```

---

## 17. Troubleshooting

| Problem | Solution |
|---------|----------|
| `docker` not found | Install/start Docker Desktop or Docker Engine |
| Port 3001 in use | Change `PORT=3002` in `.env` and `docker-compose.yml` ports |
| Login fails | Set `JWT_SECRET` in `.env`; restart app |
| `Cannot find module 'express'` | Run `cd backend && npm install` |
| Upload does nothing | Must be logged in; check browser console (F12) |
| White page behind proxy | Check Apache/nginx ProxyPass target is `127.0.0.1:3001` |
| Cannot access from LAN | Open firewall port; use server IP not `localhost` |
| Demo data resets on restart | Set `RUN_SEED=false` |

**Health check:**

```bash
curl http://localhost:3001/api/health
```

**API login test:**

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"super_admin","password":"ChangeMe123!"}'
```

---

## Related documents

| Document | Purpose |
|----------|---------|
| [USER-GUIDE.md](USER-GUIDE.md) | End-user operating manual |
| [README.md](README.md) | Documentation index |
| [PRODUCTION.md](../PRODUCTION.md) | Production deployment reference |
| [INSTALL-WAMP-DOCKER.md](../INSTALL-WAMP-DOCKER.md) | Windows WAMP + Docker detail |
| [INSTALL-SERVER.md](../INSTALL-SERVER.md) | Linux server quick install |
| [DEPLOY.md](../DEPLOY.md) | Git/ZIP deploy from GitHub |
