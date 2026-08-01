# TruckControl — User Guide & Operating Directive

**Version:** v1.2.0-production  
**Audience:** Operations staff, border moderators, area supervisors, managers, and administrators

This document explains how to use TruckControl day to day: what each menu does, how workflows move trucks from border entry to POD and southbound exit, and how to upload live files, run reports, and manage users.

---

## Table of contents

1. [Getting started](#1-getting-started)
2. [Roles and access](#2-roles-and-access)
3. [Navigation overview](#3-navigation-overview)
4. [Main — Dashboard](#4-main--dashboard)
5. [Operations](#5-operations)
6. [Areas](#6-areas)
7. [Communication](#7-communication)
8. [Management](#8-management)
9. [Administration](#9-administration)
10. [Daily operating procedures](#10-daily-operating-procedures)
11. [KPI colours and alerts](#11-kpi-colours-and-alerts)
12. [Uploads and templates](#12-uploads-and-templates)
13. [Comments, process guide, and help](#13-comments-process-guide-and-help)
14. [Reports](#14-reports)
15. [Notifications and sidebar badges](#15-notifications-and-sidebar-badges)
16. [Troubleshooting for users](#16-troubleshooting-for-users)

---

## 1. Getting started

### Sign in

1. Open the application URL provided by your IT team (typically `http://your-server:3001`).
2. Enter your **username** and **password**.
3. After first login, change your password if your administrator requires it.

Default demo accounts (change after first deploy):

| Username | Role | Typical use |
|----------|------|-------------|
| `super_admin` | Super Admin | Full system access |
| `ops_manager` | Manager | Operations oversight |
| `border_moderator` | Moderator | Border and clearance work |
| `driver_user` | User | Limited operational view |
| `kanyaka_dispatcher` | Moderator | Kanyaka area dispatch |

### Browser requirements

- Use a modern browser: Chrome, Edge, or Firefox (latest versions).
- Allow JavaScript. The app is a single-page application; no separate desktop install is required.

### Layout

- **Left sidebar** — main navigation; badge numbers show live counts where applicable.
- **Top bar** — page title, notification bell, theme, and user menu.
- **Main content** — tables, filters, KPI cards, and action buttons for the current page.

---

## 2. Roles and access

| Role | Capabilities |
|------|----------------|
| **Super Admin** | All modules, all admin pages, upload templates, user/role management |
| **Manager** | Broad operational access; may manage users depending on settings |
| **Moderator** | Edit trips in assigned areas and modules |
| **User** | View and limited edit per module permissions |

Your administrator can restrict access **per module** (NB, SB, Border, POD, etc.) and **per geographic area** (Kasumbalesa, Kanyaka, Kolwezi, Sakania, Mokambo, etc.).

If you cannot see a menu item, contact your Super Admin to check **Module Permissions** and **Area Assignments**.

---

## 3. Navigation overview

| Section | Menu items |
|---------|------------|
| **Main** | Dashboard |
| **Operations** | NB Operations, SB Operations, Border Clearance, POD Management |
| **Areas** | Area Trucks |
| **Communication** | Communication Matrix, Driver Registry, Internal Communication |
| **Management** | Assets & Equipment, Runner Fees, Reports, Turnarounds, Position Live |
| **Admin** | Users, Roles, Settings, Themes, KPI Settings, Audit Logs, Area Status Lists, Area Assignments, Module Permissions, Fleet settings, Upload Templates |

Use the **Help** assistant (bottom-right or help panel) to search any menu by name and get a short description.

---

## 4. Main — Dashboard

The Dashboard is your command centre.

**What you see:**

- Total trucks in DRC, NB/SB outstanding counts, POD pending
- Orange and red alert summaries
- Quick links into filtered trip lists

**What to do:**

- Click any **stat card** to drill down into the related list.
- Use **📈 Report** (where shown) to open a pre-built report for dashboard metrics.
- Review the **notification bell** for system alerts grouped by menu.

---

## 5. Operations

### 5.1 NB Operations (Northbound)

Trucks **entering** DRC. Workflow columns (left to right):

**Border → Kanyaka → Offloading → POD**

**Daily tasks:**

1. **Upload NB Live File** — CSV/Excel with today's northbound trips (use **Download NB Template** or `samples/NB_Live_Template.csv`).
2. Filter by **area**, **border**, **KPI** (On Track / Priority / Overdue), or search by trip/truck/transporter.
3. Update each workflow step: click the status cell or use row actions; dates and user names are recorded automatically.
4. Open **💬 Comment** on a row to add notes, view history, or follow the **process guide** timeline.
5. **Position columns** (Morning / Afternoon / Evening) fill when position files are uploaded and matched by **trip + truck**.

**Column manager:** Use **Columns** to show/hide fields and **freeze** key columns while scrolling. Preferences are saved in your browser per page.

### 5.2 SB Operations (Southbound)

Trucks **exiting** DRC. Workflow:

**Loading → Documents → Seal → Escort → Dispatch → Kanyaka → Border Exit**

**Daily tasks:**

1. **Upload SB Live File** (template in `samples/SB_Live_Template.csv`).
2. Advance each step as the truck moves through loading and dispatch.
3. Link turnaround trucks when the same physical truck continues NB→SB (see Turnarounds).

### 5.3 Border Clearance

Dedicated view with **separate NB and SB tables**.

- Each clearance status is its own column with **date** and **who recorded it**.
- Border processes include **KBP**, **Whisky**, **Direct**, and related steps per border configuration.
- **KPI cards** summarise Kasumbalesa, Sakania, and Mokambo performance.
- Click a **driver name** to open or register driver details (WhatsApp, DRC mobile) in the Driver Registry.

### 5.4 POD Management

Proof-of-delivery pipeline:

**Collect → Scan → Upload → Send to Invoicing**

- Filter by area, KPI, or POD stage.
- Use row action buttons or **💬** to advance each stage.
- Overdue PODs appear in red on the Dashboard and in sidebar badges.

---

## 6. Areas

### Area Trucks

Browse trucks by geographic area: Kanyaka, Kolwezi, Kasumbalesa, and others.

- Same live table format as NB/SB with workflow status columns.
- Intended for **area supervisors** who only need their region.
- Respects your **area assignments** — you only see areas assigned to you.

---

## 7. Communication

### Communication Matrix

Directory of contacts by function and area: clearing agents, border officers, dispatchers, POD team. Add or edit contacts and link them to borders or areas.

### Driver Registry

Register **NB drivers** at border: name, truck plate, DRC mobile, WhatsApp, border, and notes. Used when recording driver details during clearance.

### Internal Communication

- **Email** — inbox, sent, drafts (team messaging).
- **Chat rooms** — borders, areas, direct messages.
- **Trip-linked threads** — KBP queues, dispatch updates, POD alerts.

---

## 8. Management

### Assets & Equipment

Fleet assets register: vehicles, phones, radios. Track documents, expiry dates, operational status, and handovers.

### Runner Fees

Calculate runner/transporter fees from border dwell time and Kanyaka transit. Filter by transporter and date range. Supports border and Kanyaka NB/SB fee tiers.

### Reports

Two types:

1. **Per-menu reports** — open from a module page via **📈 Report** or from the Reports menu; choose columns and filters for that module.
2. **Cross-Menu Custom Report** — select fields from **multiple menus** (e.g. NB + Border + POD), apply shared filters (direction, KPI, area, border, POD status, search), and **save layouts** in your browser.

Export or print from the report view as needed.

### Turnarounds

End-to-end **NB → SB** journey on the **same truck**:

- Summary KPI cards at the top (counts by round-trip status).
- Full list below with **search**, **status**, **transporter**, **same-truck policy**, and **date from/to** filters.
- Expand a row for detailed NB/SB timeline.
- Policy for same-truck SB is set under **Admin → Fleet — Same Truck for SB**.

### Position Live

- Map and table of live truck positions.
- Upload position files (typically **3× daily**: morning, afternoon, evening).
- Positions sync to **NB Operations** and **SB Operations** when **trip number + truck plate** match.

---

## 9. Administration

*Super Admin and authorised managers only.*

| Page | Purpose |
|------|---------|
| **Manage Users** | Create accounts, assign roles, areas, activate/ban, reset passwords |
| **Role Manager** | Define roles and global permissions (read, edit, manage users, settings, logs) |
| **System Settings** | Sign-ups, maintenance mode, session timeout, app name, backup schedule |
| **Themes** | Colour themes (Ocean Blue, Midnight Pro, Forest Logistics, etc.) |
| **KPI Settings** | SLA targets per workflow step, border process, POD stage |
| **Audit Logs** | Who changed what, when, from which IP |
| **Area Status Lists** | Valid status names per area for NB, SB, border workflows |
| **Area Assignments** | Which areas each user can see |
| **Module Permissions** | View / edit / delete per module and area |
| **Fleet — Same Truck for SB** | Turnaround linking policy |
| **Upload Templates** | Column layouts for NB/SB live and position uploads |

**Security directive for administrators:**

1. Change all default passwords after first deploy.
2. Set `RUN_SEED=false` in server `.env` after initial setup (see installation guide).
3. Use strong `JWT_SECRET` on the server.
4. Review audit logs weekly.
5. Back up the database regularly (`backend/data/truckcontrol.db` or Docker volume).

---

## 10. Daily operating procedures

### Morning checklist (operations desk)

| Time | Action | Where |
|------|--------|-------|
| Start of shift | Sign in; check Dashboard alerts and notification bell | Dashboard |
| Morning | Upload NB and SB live files | NB / SB Operations |
| Morning | Upload first position file | Position Live |
| Ongoing | Update border clearance columns as trucks clear | Border Clearance |
| Ongoing | Register new drivers at border | Driver Registry |
| Afternoon / evening | Upload 2nd and 3rd position files | Position Live |
| End of shift | Advance POD stages; note overdue KPIs | POD Management |
| As needed | Run cross-menu report for management | Reports |

### Who updates what

| Task | Typical role |
|------|----------------|
| NB/SB live file upload | Operations dispatcher |
| Border status columns | Border moderator |
| Kanyaka / offloading | Area moderator |
| POD stages | POD team |
| Driver registration | Border moderator |
| User/role changes | Super Admin |

---

## 11. KPI colours and alerts

| Colour | Meaning |
|--------|---------|
| **Green** | On Track — within SLA |
| **Orange** | Priority — approaching deadline |
| **Red** | Overdue — past SLA |

KPI colours are consistent across truck rows, status cells, and summary cards. SLA hours are configured in **Admin → KPI Settings**.

---

## 12. Uploads and templates

| Upload type | Location | Template |
|-------------|----------|----------|
| NB Live | NB Operations | Download NB Template / `samples/NB_Live_Template.csv` |
| SB Live | SB Operations | Download SB Template / `samples/SB_Live_Template.csv` |
| Position (3× daily) | Position Live | Admin-defined or default position template |

**Rules:**

- You must be **logged in** for uploads to save to the database.
- Trip and truck identifiers must match your live file conventions for position sync to work.
- Super Admin can customise column mappings under **Upload Templates**.

---

## 13. Comments, process guide, and help

- **💬 Comment** on any trip row opens the comment modal with history and @mentions where configured.
- **Process guide** inside the comment modal shows the expected timeline for that workflow step.
- **Help assistant** answers questions about menus and procedures; search by keyword (e.g. "POD", "border", "upload").

---

## 14. Reports

### Single-module report

1. Open a module (e.g. NB Operations).
2. Click **📈 Report** (or go to **Reports** and pick a module).
3. Select columns, filters, and date range.
4. View KPI summary and detail table.

### Cross-menu custom report

1. Go to **Reports → Cross-Menu Custom Report**.
2. Select one or more menus (NB, SB, Border, POD, etc.).
3. Pick fields from each menu.
4. Apply filters: direction, KPI, area, border, POD status, free-text search.
5. **Save layout** to reuse later (stored in your browser).

---

## 15. Notifications and sidebar badges

- **Sidebar badges** show live counts (e.g. overdue NB, pending POD) per menu.
- **Notification bell** groups alerts by menu; click an alert to jump to the relevant page.
- Counts refresh when you navigate or when data is uploaded/updated.

---

## 16. Troubleshooting for users

| Problem | What to try |
|---------|-------------|
| Cannot sign in | Verify username/password; contact admin to reset |
| Menu missing | Ask admin to check module permissions and area assignments |
| Upload has no effect | Confirm you are logged in; check file format against template |
| Position not showing on NB/SB | Ensure trip number **and** truck plate match the live file |
| KPI always red | Admin may need to adjust SLA in KPI Settings |
| Page blank or errors | Hard refresh (Ctrl+F5); try another browser; report to IT |

For server installation issues, see [INSTALLATION.md](INSTALLATION.md).

---

## Document control

| Field | Value |
|-------|-------|
| Product | TruckControl — Truck Turnaround & Operations Control System |
| Guide version | v1.2.0-production |
| Related docs | [INSTALLATION.md](INSTALLATION.md), [README.md](README.md), [PRODUCTION.md](../PRODUCTION.md) |
