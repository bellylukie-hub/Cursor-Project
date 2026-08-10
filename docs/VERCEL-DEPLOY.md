# Deploy TruckControl on Vercel — Step by Step

TruckControl is a **full-stack** application: a browser UI plus a **Node.js API** with a **SQLite database**. Vercel is excellent for the **frontend**; the **API must run on a host that supports a persistent server** (Docker VPS, Railway, Render, Fly.io, etc.).

This guide gives you a practical **two-part deploy**:

1. **Backend API** — persistent server (recommended: Docker on a VPS, or Railway/Render)
2. **Frontend** — static files on Vercel pointing at your API URL

---

## Before you start

| Item | Detail |
|------|--------|
| GitHub account | Code pushed to GitHub |
| Vercel account | Free tier works for the UI |
| API host | VPS with Docker **or** Railway / Render (see below) |
| Domain (optional) | Custom domain on Vercel + API subdomain |

---

## Part A — Deploy the API (required)

Vercel **cannot** run this app’s full backend as-is (SQLite file storage, long-running uploads, Docker). Deploy the API first.

### Option A1 — Docker on a VPS (recommended)

1. Download the production ZIP from GitHub Releases (`TruckControl-Production-v2.5.5-full-production.zip`) or clone the repo.
2. On your server (Ubuntu/Linux):

```bash
unzip TruckControl-Production-v2.5.5-full-production.zip
cd TruckControl-Production-v2.5.5-full-production
cp .env.example .env
```

3. Edit `.env`:

```env
JWT_SECRET=your-long-random-secret-at-least-32-characters
RUN_SEED=true
REQUIRE_AUTH=true
PORT=3001
CORS_ORIGIN=https://your-app.vercel.app
```

4. Start:

```bash
docker compose up -d --build
```

5. Test:

```bash
curl https://your-server-domain.com/api/health
```

Note your public API URL, e.g. `https://api.yourcompany.com/api` or `https://your-server-ip:3001/api`.

6. After first login, set `RUN_SEED=false` and restart.

### Option A2 — Railway or Render

1. Create a new **Web Service** from your GitHub repo.
2. Set **root directory** to `backend` (or use the Dockerfile at repo root).
3. Set environment variables: `JWT_SECRET`, `REQUIRE_AUTH=true`, `DATA_DIR=/data`, `PORT=3001`.
4. Add a **persistent volume** for `/data` (database).
5. Deploy and copy the service URL, e.g. `https://truckcontrol-api.onrender.com`.

Set `CORS_ORIGIN` to your future Vercel URL.

---

## Part B — Deploy the frontend on Vercel

### Step 1 — Push code to GitHub

Ensure your repository contains at least:

- `index.html`, all `*.js` frontend files
- `images/login-hero.jpg`
- `vercel.json`
- `favicon.svg`

The backend can stay in the same repo; Vercel will only publish static files.

### Step 2 — Import project in Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in.
2. Click **Add New… → Project**.
3. **Import** your GitHub repository (`Cursor-Project` or your fork).
4. Framework preset: **Other** (static site).

### Step 3 — Configure build settings

| Setting | Value |
|---------|--------|
| Root Directory | `.` (repository root) |
| Build Command | `chmod +x scripts/verify-production-package.sh && ./scripts/verify-production-package.sh` |
| Output Directory | `.` |
| Install Command | *(leave empty)* |

`vercel.json` in the repo already defines rewrites so all routes serve `index.html`.

### Step 4 — Point the UI at your API

Before deploying, add an environment variable in Vercel:

| Name | Example value |
|------|----------------|
| `TRUCKCONTROL_API_URL` | `https://api.yourcompany.com/api` |

Create a small config file the app reads on load. Add this **before** `api.js` in `index.html` (or use Vercel’s build to inject it):

```html
<script>
  window.TRUCKCONTROL_API = 'https://YOUR-API-HOST/api';
</script>
```

Replace `YOUR-API-HOST` with your real API URL from Part A.

> **Important:** `api.js` uses `window.TRUCKCONTROL_API` when set. Without it, the UI defaults to `http://localhost:3001/api`, which will not work in production on Vercel.

### Step 5 — Deploy

1. Click **Deploy**.
2. Wait for the build to finish.
3. Open the Vercel URL (e.g. `https://truckcontrol.vercel.app`).
4. You should see the **Control Room Black** login page with the truck hero image.
5. Sign in with `super_admin` / `ChangeMe123!` (if API seed is enabled).

### Step 6 — Fix CORS (if login fails)

On the **API server**, set in `.env`:

```env
CORS_ORIGIN=https://your-app.vercel.app
```

Restart the API container/service, then try login again.

### Step 7 — Custom domain (optional)

1. In Vercel → **Project → Settings → Domains**, add `app.yourcompany.com`.
2. Add the DNS records Vercel shows.
3. Update API `CORS_ORIGIN` to `https://app.yourcompany.com`.
4. Update `window.TRUCKCONTROL_API` if you use a custom API subdomain.

---

## What works on Vercel vs what needs the API

| Feature | Vercel (UI only) | API server |
|---------|------------------|------------|
| Login page & dark theme | Yes | Auth endpoint |
| Dashboard & menus | Yes | Trip/user data |
| Email / chat between users | UI yes | **Required** — shared mailbox |
| File uploads (NB/SB live) | UI yes | **Required** |
| Database Browser | UI yes | **Required** — Super Admin |
| SQLite persistence | No | **Required** on API host |

---

## All-in-one alternative (no Vercel)

If you want **one simple deploy** without splitting frontend and API:

```bash
docker compose up -d --build
```

Open `http://your-server:3001` — the Node server serves **both** the UI and API. This is the approach used in `DOWNLOAD.md` and `START-HERE.txt`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page after deploy | Check browser console for 404 on `.js` files; ensure all scripts are in the repo |
| Login fails / network error | Set `window.TRUCKCONTROL_API` to your live API URL |
| CORS error in console | Set `CORS_ORIGIN` on API to your exact Vercel URL (https, no trailing slash) |
| Hero image missing on login | Ensure `images/login-hero.jpg` is committed and deployed |
| Theme not dark | Admin → Themes → select **Control Room Black** (default on new installs) |

---

## Related docs

- [DOWNLOAD.md](../DOWNLOAD.md) — production ZIP download
- [INSTALLATION.md](INSTALLATION.md) — Docker, HTTPS, Linux server
- [COMPLETE-MANUAL.md](COMPLETE-MANUAL.md) — illustrated user manual (included in ZIP)
