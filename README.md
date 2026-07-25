# Turnaround Control System

Working web application for DRC North Bound and South Bound truck turnaround operations.

## Included
- JWT authentication and seeded administrator account
- Live NB/SB truck worklists with KPI colour alerts
- Trip profile, structured status updates, immutable workflow timeline, and audit records
- File uploads for clearance, POD, and other documents
- Excel import with row-level duplicate validation
- Control-tower dashboard, historical turnaround report, and Excel export
- SQLite persistence and API endpoints for assets, runner fees, users, documents, and operations

## Run locally
```bash
npm install
npm run dev
```

Open the address shown by Vite (normally `http://localhost:5173`).

Initial administrator:
`admin@turnaround.local` / `ChangeMe123!`

Change the default password and set `JWT_SECRET` before deploying. SQLite is suitable for the included self-contained deployment; use PostgreSQL/object storage for a multi-user production deployment.
