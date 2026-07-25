# TTOCS — Truck Turnaround & Operations Control System

Web application structure for DRC truck turnaround operations, arranged from the operational draft and SRS.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- Modular UI shell with left navigation, top bar (search + priority alerts), and module pages
- Demo/mock data for live trucks, KPI colors, border status catalogs, and runner fee rules

## Application modules

| Menu | Purpose |
| --- | --- |
| **Dashboard** | Control tower: DRC/NB/SB/POD/expiry KPIs, click-through lists, alert center |
| **NB Operations** | Upload, main worklist, Kasumbalesa/Sakania/Mokambo borders, Kanyaka, offloading, POD |
| **SB Operations** | Upload, loading plan/process, dispatch/escort, following-on, Kanyaka, border exit |
| **Areas** | Kasumbalesa, Kanyaka, Lubumbashi/Kipushi, Likasi/Tenke, Kambove/Kisanfu, Kolwezi, Unassigned |
| **Cars / Trucks** | Register, documents, maintenance, handover, expiry |
| **Equipment** | Register, assignments, maintenance, handover |
| **Communication** | Matrix, internal messages, chat |
| **Runner Fee** | Owner/border/direction duration groups and rates |
| **Reports** | KPI, NB/SB/POD, assets, communication, runner fee, audit |
| **Uploads** | DRC turnaround, NB, SB, positions, Gov list |
| **Admin** | Users/roles, areas/aliases, KPI, statuses, document types, page builder, SQL views, audit |

## KPI colors

- **Green** — On time
- **Orange** — Priority (right-corner alerts for responsible user)
- **Red** — Overdue

## Key business rules (encoded in IA)

- Unique active **Trip + Truck** on daily uploads
- NB live removal after **POD completion**
- SB live removal after **Date Exit to Zambia**
- NB area assignment from **offloading point**; SB from **loading point**
- Comments: Problem · Person contacted · Solution · Expected time
- Delete requires permission + mandatory reason + audit

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Open control tower**.

## Next development phases (from SRS)

1. Auth, users/roles, areas, KPI settings, Excel import engine, live NB/SB pages  
2. Status workflows, trip timeline, documents, POD  
3. KPI engine + realtime alerts  
4. Assets & equipment  
5. Reports + runner fees  
6. Communication + page builder / SQL views  
7. Future: GPS, WhatsApp, OCR, BI, offline PWA  

This repo currently delivers the **information architecture and UI shell** with mock data so teams can navigate the full product shape before backend wiring.
