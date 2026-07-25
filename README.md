# TruckControl DRC — Operations Control Demo

Interactive demo for the **Truck Turnaround & Operations Control System** (NB/SB workflows in DRC).

## Run locally

Open `index.html` in a browser, or serve it:

```bash
npx --yes serve .
```

Then visit the URL shown in the terminal (usually `http://localhost:3000`).

## What’s included

- Dashboard with KPI cards and priority alerts
- NB / SB operations tables with filters, search, upload, export
- Border Clearance and POD Management
- Area pages: Kasumbalesa, Kanyaka, Lubumbashi/Kipushi, Likasi/Tenke, Kambove/Kisanfu, Kolwezi
- Assets & Equipment register
- Runner fee rates + calculator modal
- Reports shortcuts
- Settings (KPI targets, users/roles overview, preferences)
- Status update modal with structured comments and workflow checks
- **Bulk status update** for NB and SB trips

Demo data lives in-memory in the page (`tripsDB`). Changes reset on refresh.
