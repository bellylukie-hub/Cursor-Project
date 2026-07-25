# TransFlow Operations Control

Responsive web application for truck turnaround operations across DRC. The interface translates the supplied SRS into a practical control tower for North Bound, South Bound, POD, area, fleet, equipment, communication, runner fee, and reporting workflows.

## Run locally

```bash
npm install
npm run dev
```

Build with:

```bash
npm run build
```

## Implemented prototype scope

- Responsive control tower dashboard
- KPI cards and weekly NB/SB performance
- Area performance overview
- Live truck priority worklist
- North Bound, South Bound, POD, area, fleet, equipment, communication, runner fee, reports, and settings module views
- Global truck/trip search
- Priority notification centre
- Structured status update workflow

The prototype uses representative in-memory data. The SRS-defined API, PostgreSQL persistence, authentication, RBAC, import validation, document storage, realtime notifications, and audit services remain backend integration work.
