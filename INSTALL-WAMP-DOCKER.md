# TruckControl on WAMP + Docker (Windows Server)

TruckControl is a **Node.js** application. It does **not** run inside WAMP’s PHP/Apache stack directly.  
Use **Docker** to run the app, and optionally use **WAMP Apache** as a front door on port 80.

---

## Recommended: Docker only (easiest)

### 1. Download and extract

1. Download: https://github.com/bellylukie-hub/Cursor-Project/releases/download/v1.1.1-server/TruckControl-Server-v1.1.1-server.zip  
2. Extract to e.g. `C:\TruckControl-Server-v1.1.1-server`

### 2. Install Docker Desktop (if not already)

- https://www.docker.com/products/docker-desktop/
- Start **Docker Desktop** and wait until it says “Running”

### 3. Configure

Open **Command Prompt** or **PowerShell**:

```bat
cd C:\TruckControl-Server-v1.1.1-server
copy .env.example .env
notepad .env
```

Edit `.env`:

```env
JWT_SECRET=put-a-long-random-secret-here-at-least-32-characters
RUN_SEED=true
PORT=3001
```

(`RUN_SEED=true` for first install only; set `false` after demo data loads.)

### 4. Start with Docker

```bat
cd C:\TruckControl-Server-v1.1.1-server
docker compose up -d --build
docker compose logs -f
```

### 5. Open the app

```
http://localhost:3001
```

From another PC on your network:

```
http://YOUR_SERVER_IP:3001
```

**Login:** `super_admin` / `ChangeMe123!`

### 6. Windows Firewall

Allow inbound **TCP 3001** (Windows Defender Firewall → Inbound Rules → New Rule → Port → 3001).

---

## Optional: WAMP Apache as reverse proxy (port 80)

Use this if you want:

```
http://your-server/truckcontrol   →   TruckControl on port 3001
```

WAMP stays on port 80; TruckControl stays in Docker on 3001.

### Step A — Enable Apache proxy modules in WAMP

1. WAMP tray icon → **Apache** → **Apache modules**
2. Enable:
   - `proxy`
   - `proxy_http`
   - `proxy_wstunnel` (optional, for future websockets)
3. Restart Apache

### Step B — Add virtual host or alias

Edit `httpd-vhosts.conf` or create a config snippet (path varies by WAMP version), e.g.:

```apache
# TruckControl reverse proxy
ProxyPreserveHost On
ProxyPass /truckcontrol http://127.0.0.1:3001/
ProxyPassReverse /truckcontrol http://127.0.0.1:3001/
```

Restart Apache from WAMP.

Then open: `http://localhost/truckcontrol`

> **Note:** If the UI loads but API calls fail, set in `.env`:
> `CORS_ORIGIN=http://localhost`  
> and restart Docker: `docker compose up -d`

---

## WAMP MySQL — not used by TruckControl

TruckControl uses **SQLite** inside Docker (volume `truckcontrol-data`).  
You do **not** need to create a MySQL database in WAMP for this app.

| Component | TruckControl uses |
|-----------|-------------------|
| Database | SQLite (in Docker volume) |
| Web server | Node.js (port 3001) |
| WAMP Apache | Optional proxy only |
| WAMP MySQL | Not required |
| WAMP PHP | Not required |

---

## Useful Docker commands (Windows)

```bat
cd C:\TruckControl-Server-v1.1.1-server

docker compose ps              :: is it running?
docker compose logs -f         :: live logs
docker compose restart         :: restart app
docker compose down            :: stop
docker compose up -d --build   :: rebuild after update
```

---

## Test uploads

1. Login as `super_admin`
2. **NB Operations** → **Upload NB Live File**
3. Use `samples\NB_Live_Template.csv` from the ZIP folder
4. Trips should appear in the table (saved to SQLite in Docker)

---

## Troubleshooting on WAMP + Windows

| Problem | Solution |
|---------|----------|
| `docker` not recognized | Install/start Docker Desktop |
| Port 3001 already in use | Change `PORT=3002` in `.env` and in `docker-compose.yml` ports |
| Port 80 conflict (WAMP vs other) | WAMP uses 80; TruckControl uses 3001 — no conflict if you use Docker on 3001 |
| Cannot access from other PCs | Open firewall port 3001; use server IP not `localhost` |
| Login fails | Check `JWT_SECRET` is set in `.env`; restart: `docker compose up -d` |
| White page after proxy | Check Apache `ProxyPass` and that Docker is running on 3001 |

**Health check:**

```bat
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok","service":"truckcontrol-api",...}`

---

## Update to a new version

```bat
docker compose down
:: Extract new ZIP (keep your .env file)
docker compose up -d --build
```

Backup first: Docker volume `truckcontrol-data` holds your database.
