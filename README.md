# TTOCS — Truck Turnaround & Operations Control System

A modular web application for managing DRC truck turnaround operations: North Bound (NB), South Bound (SB), border clearance, area control, POD, assets, equipment, KPI dashboards, reports, runner fees, and internal communication.

Based on the operational structure and Software Requirements Specification (SRS) documents.

## Application structure

```
src/
├── app/
│   ├── (dashboard)/          # All authenticated module pages
│   │   ├── dashboard/        # Control tower & KPI dashboards
│   │   ├── nb/               # North Bound operations
│   │   ├── sb/               # South Bound operations
│   │   ├── areas/            # Area-specific worklists
│   │   ├── imports/          # Daily Excel uploads
│   │   ├── assets/           # Cars/trucks register
│   │   ├── equipment/        # Equipment register
│   │   ├── communication/    # Matrix, email, chat
│   │   ├── runner-fees/      # Fee calculator
│   │   ├── reports/          # Management reports
│   │   └── admin/            # Settings & configuration
│   └── api/                  # REST API endpoints
├── components/
│   ├── layout/               # Sidebar, top bar, app shell
│   ├── modules/              # Reusable module page template
│   └── ui/                   # Page header, KPI badges, tables
├── config/
│   └── navigation.ts         # Full menu structure from SRS
├── lib/
│   ├── constants.ts          # KPI targets, areas, document types
│   ├── runner-fees.ts        # Fee calculation logic
│   └── prisma.ts             # Database client
└── types/                    # Shared TypeScript types

prisma/
└── schema.prisma             # PostgreSQL schema (SRS Section 14)
```

## Main modules (from SRS)

| Module | Purpose |
|--------|---------|
| **Dashboard** | Live DRC time, NB/SB achievement, area/user KPIs, POD, document expiry, alerts |
| **NB Operations** | Border (Kasumbalesa, Sakania, Mokambo) → Kanyaka → Offloading → POD |
| **SB Operations** | Loading plan → Loading → Dispatch → Following-on → Kanyaka → Border exit |
| **Area Pages** | Trucks auto-grouped by offloading/loading point mapping |
| **Imports** | DRC/NB/SB daily uploads with Trip+Truck duplicate validation |
| **Assets & Equipment** | Vehicle register, documents, maintenance, handover |
| **Communication** | Contact matrix, internal email, group chat |
| **Runner Fees** | Border/direction/duration-based fee calculation |
| **Reports** | Filterable reports with Excel export |
| **Admin** | Users, roles, KPIs, areas, statuses, page builder, SQL views |

## KPI targets (configurable in Admin)

| Process | Target |
|---------|--------|
| NB full turnaround | 14 days |
| NB TR8/T1 clearance | 48 hours |
| NB IM4 clearance | 72 hours |
| POD collection | 48 hours |
| SB loading process | ≤ 48 hours |
| SB dispatch/escort | ≤ 8 days |
| Following-on list | ≤ 2 hours |

Alert colors: **Green** = on time, **Orange** = priority (right-corner alert), **Red** = overdue.

## Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API routes (REST)
- **Database:** PostgreSQL with Prisma ORM
- **File storage:** Object storage (to be configured)

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Setup

```bash
npm install
cp .env.example .env
# Edit DATABASE_URL in .env

npx prisma generate
npx prisma migrate dev --name init

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to the dashboard.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## Development roadmap (from SRS)

1. **Foundation** — Auth, users, roles, areas, uploads, live NB/SB pages
2. **Operations** — Status forms, border pages, POD workflow, documents
3. **Dashboard & Alerts** — KPI engine, Green/Orange/Red, notifications
4. **Assets & Equipment** — Registers, maintenance, handover, expiry
5. **Reports & Runner Fees** — Excel export, fee reports
6. **Communication & Admin** — Messaging, page builder, SQL views
7. **Future** — GPS, WhatsApp, OCR, BI, mobile PWA

## API endpoints (planned)

See `docs/ARCHITECTURE.md` for the full API map from SRS Appendix B.

Health check: `GET /api/health`

## License

Private — internal operations use.
