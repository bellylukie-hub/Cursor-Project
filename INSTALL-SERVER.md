# TruckControl — Easiest Server Installation

**Version:** v1.1.1-server  
**Port:** 3001 (UI + API together)

---

## What you need on the server

| Method | Requirements |
|--------|----------------|
| **Docker (easiest)** | Docker + Docker Compose |
| **Manual** | Node.js 20 or newer |

---

## Method 1 — Docker (recommended)

### Step 1 — Upload and extract the ZIP

```bash
unzip TruckControl-Server-v1.1.1.zip
cd TruckControl-Server-v1.1.1
```

### Step 2 — Configure

```bash
cp .env.example .env
nano .env
```

**Required:** set `JWT_SECRET` to a long random string (32+ characters).

For **first install**, keep:
```
RUN_SEED=true
```

After you confirm login and demo data work, change to `RUN_SEED=false` and restart.

### Step 3 — Start

```bash
chmod +x install-docker.sh
./install-docker.sh
```

Or manually:

```bash
docker compose up -d --build
docker compose logs -f
```

### Step 4 — Open the app

```
http://YOUR_SERVER_IP:3001
```

**Login:** `super_admin` / `ChangeMe123!`

### Firewall

```bash
# Ubuntu example
sudo ufw allow 3001/tcp
```

---

## Method 2 — Manual (Node.js, no Docker)

```bash
unzip TruckControl-Server-v1.1.1.zip
cd TruckControl-Server-v1.1.1
chmod +x install-linux.sh
./install-linux.sh
```

Then start:

```bash
cd backend
npm start
```

For 24/7:

```bash
npm install -g pm2
cd ..
pm2 start ecosystem.config.cjs
pm2 save
```

---

## Test uploads after install

1. Sign in as `super_admin`
2. Go to **NB Operations** → **Upload NB Live File**
3. Click **Download NB Template** (or use the CSV template in `samples/`)
4. Upload the CSV — trips should appear in the table
5. Repeat for **SB Operations** → **Upload SB Live File**
6. **Position Live** → upload position file (3× daily slots)

Uploads are saved to the **SQLite database** when the backend is running with login.

---

## Default users

| Username | Password | Role |
|----------|----------|------|
| super_admin | ChangeMe123! | Super Admin |
| ops_manager | ChangeMe123! | Manager |
| border_moderator | ChangeMe123! | Moderator |

Change passwords after first login.

---

## Backup

**Docker:**
```bash
docker compose exec truckcontrol ls /data
# Backup volumes truckcontrol-data and truckcontrol-uploads
```

**Manual:**
- `backend/data/truckcontrol.db`
- `backend/uploads/`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Cannot find module 'express' | Run `cd backend && npm install` |
| Login fails | Check `JWT_SECRET` is set in `.env` |
| Upload does nothing | Ensure you are logged in; check browser console |
| Port in use | Change `PORT=3002` in `.env` |

**Health check:**
```bash
curl http://localhost:3001/api/health
```

---

## Update to a newer version

```bash
# Backup data first, then:
docker compose down
# Extract new ZIP over the folder (keep .env)
docker compose up -d --build
```
