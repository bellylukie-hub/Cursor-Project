# Truck Turnaround & Operations Control System

Interactive demo for DRC truck operations management (NB/SB, border clearance, POD, and more).

## Preview locally

Open `index.html` in your browser, or run a simple server:

```bash
cd /workspace
python3 -m http.server 8080
```

Then visit: http://localhost:8080

## What's included

- **Dashboard** — NB & SB tables with search and KPI filter
- **NB / SB Operations** — Full filtering and upload actions
- **Border Clearance** — Overview plus detail pages:
  - Kasumbalesa KBP (frozen truck bar, time tracking, step workflow, docs, comments, activity log)
  - Kasumbalesa Whisky
  - Sakania & Mokambo
- **Comment modal** — Normal vs structured problem reports, file upload
- **POD, Areas, Runner Fees, Reports** — Placeholder pages ready to extend

## Files

| File | Description |
|------|-------------|
| `index.html` | Main UI shell, styles, and modals |
| `app.js` | Page renderers, navigation, and demo data |
