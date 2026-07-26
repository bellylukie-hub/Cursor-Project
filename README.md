# Truck Turnaround & Operations Control System

Interactive demo for DRC truck operations management (NB/SB, border clearance, POD, turnarounds, and admin RBAC).

## Quick start (with backend)

The backend enforces the full operational lifecycle:

**NB:** Border clearance (all steps) → Kanyaka Transit → Offloading → POD Collection  
**SB:** Loading → Document Collection → Seal → Escort → Dispatch → Kanyaka (Gov List from mine) → Border Exit

Same truck/trip is linked via **Turnarounds** (configurable per fleet).

```bash
cd backend
npm install
npm run seed    # load demo trips + linked NB→SB turnaround
npm start       # API + UI on http://localhost:3001
```

## Preview locally (frontend only)

```bash
cd /workspace
python3 -m http.server 8080
```

Then visit: http://localhost:8080 (uses in-memory demo data; no workflow enforcement).

## Backend API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/trips` | List all trips with workflow state |
| `POST /api/trips/upload-nb` | Upload NB data — starts border clearance |
| `POST /api/trips/:id/advance-step` | Advance workflow (enforces order) |
| `POST /api/trips/:id/border-step/:n/complete` | Complete border sub-step |
| `POST /api/turnarounds/from-nb/:nb/create-sb` | Create SB on same turnaround after POD invoiced |
| `POST /api/kanyaka/:id/gov-list` | Upload Gov List from mine (SB Kanyaka) |
| `POST /api/kanyaka/:id/exception` | Approve Kanyaka transit exception |
| `POST /api/pod/:id/:stage` | POD: collected → scanned → uploaded → sent_to_invoicing |
| `GET/PATCH /api/fleet` | Fleet same-truck-for-SB policy |

## What's included

- **Dashboard** — NB & SB tables with search and KPI filter
- **Turnarounds** — NB→SB lifecycle, Gov List upload, fleet same-truck toggle
- **NB / SB Operations** — Full filtering and upload actions
- **Border Clearance** — KBP, Whisky, Sakania, Mokambo processes
- **Admin RBAC** — Users, Roles, Settings, Audit Logs
- **Communication** — Matrix + Internal (email/chat)

## Files

| File | Description |
|------|-------------|
| `index.html` | Main UI shell, styles, and modals |
| `app.js` | Page renderers, navigation, and demo data |
| `api.js` | Frontend API client |
| `backend/` | Node.js + SQLite workflow engine |
