# TTOCS Architecture

## System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Web Application (Next.js)                      │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Dashboard  │  NB / SB Ops │    Areas     │  Assets/Equipment  │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│              Import Engine │ Workflow Engine │ KPI/Alert Engine    │
├──────────────────────────┴─────────────────┴────────────────────┤
│                    REST API Layer (/api/*)                       │
├─────────────────────────────────────────────────────────────────┤
│              PostgreSQL (Prisma)  │  File Storage               │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation map

The left sidebar mirrors SRS Section 3 (Main Menu and Application Modules):

1. Dashboard → Overview, NB, SB, Areas, POD, Documents, Alerts
2. NB Operations → Upload, Border posts, Kanyaka, Offloading, POD
3. SB Operations → Upload, Loading, Dispatch, Following-on, Kanyaka, Border
4. Area Pages → Kasumbalesa, Kanyaka, Lubumbashi, Likasi, Kambove, Kolwezi
5. Imports → DRC turnaround, NB, SB, Positions, Gov lists
6. Cars/Trucks/Assets → Register, documents, maintenance, handover
7. Equipment → Register, assignment, maintenance, handover
8. Communication → Matrix, internal email, group chat
9. Runner Fees → Calculator with grouping and subtotals
10. Reports → KPI, NB, SB, POD, assets, audit
11. Admin → Users, roles, areas, KPIs, statuses, page builder

## Operational workflows

### North Bound (NB)

```
Border → Kanyaka → Offloading Point → POD Collection
  │         │            │                  │
  │         │            │                  └── Closes live NB record
  │         │            └── POD from mine or via Kanyaka
  │         └── Weighing, POD receipt
  └── Kasumbalesa / Sakania / Mokambo clearance
```

**Live removal:** Truck disappears from NB main page when POD completion rule is met.

### South Bound (SB)

```
Loading Plan → Loading Process → Dispatch/Escort → Following-on → Kanyaka → Border → Exit Zambia
```

**Live removal:** Truck disappears from SB main page when Date Exit to Zambia is filled.

### Area assignment

| Direction | Source field | Rule |
|-----------|-------------|------|
| NB | Offloading point | Match against area alias list |
| SB | Loading point | Match against area alias list |
| Both | Manual override | Requires comment + audit log |
| Both | Unmatched | Goes to "Unassigned Area" queue |

## Database entities

Core tables from SRS Section 14:

- **Identity:** users, roles, permissions, user_roles, role_permissions
- **Areas:** areas, area_aliases, user_areas
- **Operations:** trucks, drivers, trips, trip_positions, trip_comments
- **Workflow:** status_definitions, trip_status_history
- **Documents:** document_types, files, documents
- **KPI/Alerts:** kpi_targets, alerts
- **Imports:** import_batches, import_errors
- **Assets:** assets, equipment, maintenance_records, handovers
- **Communication:** communication_contacts, messages, chat_rooms, chat_messages
- **Fees:** runner_fee_records
- **Admin:** audit_logs, saved_sql_views, page_configs

## API endpoint map (SRS Appendix B)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Users/Roles | `GET/POST /users`, `GET/POST /roles`, `POST /users/{id}/areas` |
| Areas | `GET/POST /areas`, `POST /areas/{id}/aliases`, `GET /areas/{id}/trips` |
| Trips | `GET/POST /trips`, `GET /trips/{id}`, `PATCH /trips/{id}`, `GET /trips/{id}/timeline` |
| Imports | `POST /imports/nb`, `POST /imports/sb`, `POST /imports/drc-turnaround` |
| Statuses | `POST /trips/{id}/statuses`, `GET /status-definitions` |
| Documents | `POST /documents/upload`, `GET /documents` |
| KPI/Alerts | `GET /dashboards/summary`, `GET /alerts`, `PATCH /alerts/{id}/read` |
| Assets | `GET/POST /assets`, `POST /assets/{id}/maintenance` |
| Reports | `GET /reports/nb`, `GET /reports/sb`, `GET /reports/export` |
| Communication | `GET/POST /contacts`, `POST /messages`, `POST /chat/messages` |
| Admin | `GET/POST /page-configs`, `GET /audit-logs` |

## Role-based access (SRS Section 4)

| Role | Scope |
|------|-------|
| Super Admin | Full system access |
| Admin | Users, areas, KPIs, statuses, page builder |
| Operations Manager | All trucks, dashboards, reports |
| Area Supervisor | Assigned areas only |
| Border User | Assigned border post |
| Kanyaka User | Kanyaka NB/SB by direction |
| Loading/Mine User | SB loading workflow |
| Offloading/POD User | NB offloading and POD |
| Asset Controller | Cars, equipment, documents |
| Runner Fee User | Fee calculation |
| Read Only | Dashboards and reports |
| External | Admin-shared pages only |

## Business rules (critical)

1. **Trip + Truck uniqueness** — Daily uploads reject duplicates
2. **Auto-populate trip** — Selecting truck fills active trip
3. **Comment structure** — Problem, Person Contacted, Solution, Expected Time
4. **Delete control** — Mandatory reason + audit log
5. **Equipment return** — Return date required before re-assignment
6. **Orange alerts** — Shown to responsible user in top-right corner
7. **Excel export** — Permission-gated on all list pages

## Border status catalogs

### Sakania / Mokambo (10 events each)
Crossing, entry card, TR8/T1 or IM4, documents collected, brigade stamp, seal, penalty (requested/sent/paid), document handover.

### Kasumbalesa — KBP process (7 events)
Parking, document submission (4h), scanning, green stamping (1h), red stamping (1h), cross-checking, driver contacts.

### Kasumbalesa — Whisky process (14 events)
Entry card, scanning (24h result), TR8/T1 or IM4, duty payment, BAE (24h), SEGUCE, bon de sortie (2h), brigade stamp, documents, seal, penalty chain, handover.

## File upload types

T1, TR8, IM4, POD, Invoice, CEEC, LMC, Parking Ticket, Entry Card, EXP1, Packing List, COD, Police Report, Insurance, Other.

## Next implementation steps

1. Authentication (NextAuth or custom JWT) with RBAC middleware
2. Excel import engine with validation and duplicate checking
3. Trip status workflow engine with configurable statuses
4. KPI calculation background jobs
5. WebSocket alerts for orange/red notifications
6. S3-compatible file storage for documents
