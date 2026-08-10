# TruckControl — Complete User & Administrator Manual

**Product:** Truck Turnaround & Operations Control System  
**Manual version:** v2.2.1-production  
**Audience:** Operations staff, dispatchers, border moderators, FMS users, managers, and system administrators

> **Illustrations:** This manual includes diagrams in `docs/images/`. View on GitHub, VS Code, or any Markdown viewer that supports SVG images.

---

## How to use this book

| Part | Who should read it | What it covers |
|------|-------------------|----------------|
| **Part I** | Everyone | Login, layout, roles |
| **Part II** | Daily users | Step-by-step use of every menu |
| **Part III** | Everyone | Help assistant (chatbot) |
| **Part IV** | Super Admin / Manager | Admin configuration — every option |
| **Part V** | IT / Super Admin | First-time system setup |
| **Part VI** | Everyone | Daily checklists & troubleshooting |

**Related documents:**
- [INSTALLATION.md](INSTALLATION.md) — server install (Docker, Windows, Linux)
- [USER-GUIDE.md](USER-GUIDE.md) — shorter operating directive
- [PRODUCTION.md](../PRODUCTION.md) — environment variables & security

### Illustration index

| Figure | File | Shows |
|--------|------|-------|
| App overview | `images/app-overview.svg` | All major modules |
| Login screen | `images/login-screen.svg` | How to sign in |
| Screen layout | `images/screen-layout.svg` | Sidebar, top bar, content, help |
| KPI legend | `images/kpi-legend.svg` | Green / orange / red meanings |
| NB workflow | `images/nb-workflow.svg` | Northbound steps |
| SB workflow | `images/sb-workflow.svg` | Southbound steps |
| FMS workflow | `images/fms-workflow.svg` | Orders → trips → fleet |
| Fleet map | `images/fleet-map.svg` | GPS pins and popups |
| Helpdesk | `images/helpdesk-workflow.svg` | Issue logging and SLA |
| Help assistant | `images/help-assistant.svg` | Chatbot usage |
| Admin setup | `images/admin-setup-order.svg` | Recommended config order |
| Module permissions | `images/module-permissions.svg` | View / edit / delete matrix |

---

# Part I — Introduction

## 1.1 What is TruckControl?

TruckControl is a web application for managing truck operations across borders and areas in the DRC corridor. It covers:

- **Live operations** — NB/SB trucks, border clearance, POD
- **Freight management (FMS)** — client orders, routes, trip scheduling, fleet registry
- **Communication** — drivers, contacts, internal email/chat, helpdesk
- **Tracking** — position live, fleet map with GPS pins
- **Administration** — users, roles, KPIs, permissions, system settings

![TruckControl application overview — operations, FMS, communication, and admin modules](images/app-overview.svg)

## 1.2 Sign in

1. Open your browser (Chrome, Edge, or Firefox).
2. Go to your app URL (e.g. `http://localhost:3001` or your company server).
3. Enter **username** and **password**.
4. Click **Sign In**.

**Default demo accounts** (change passwords after first deploy):

| Username | Role | Typical use |
|----------|------|-------------|
| `super_admin` | Super Admin | Full system access |
| `ops_manager` | Manager | Operations oversight |
| `border_moderator` | Moderator | Border work |
| `driver_user` | User | Limited view |
| `kanyaka_dispatcher` | Moderator | Kanyaka dispatch |

Default password: `ChangeMe123!` (unless changed in server `.env`).

![Login screen — enter username and password, then click Sign In](images/login-screen.svg)

## 1.3 Screen layout

![Application screen layout — sidebar, top bar, main content, and help assistant](images/screen-layout.svg)

```
┌─────────────────┬──────────────────────────────────────────┐
│  LEFT SIDEBAR   │  MAIN CONTENT                            │
│  (navigation)   │  tables · forms · maps · reports         │
│                 │                                          │
│  Dashboard      │  ┌────────────────────────────────────┐  │
│  NB Operations  │  │ Page title · filters · buttons     │  │
│  SB Operations  │  │ KPI cards                          │  │
│  ...            │  │ Data table or form                 │  │
│  Admin          │  └────────────────────────────────────┘  │
└─────────────────┴──────────────────────────────────────────┘
         ↑                              ↑
    Click menu items            Top bar: alerts, user menu
```

- **Sidebar badges** (red/orange numbers) — counts of items needing attention.
- **Notification bell** — system alerts grouped by menu.
- **Help assistant** — chat panel (usually bottom-right) for guided help.

## 1.4 Roles and access

| Role | Typical access |
|------|----------------|
| **Super Admin** | Everything including all Admin pages |
| **Manager** | Operations + most admin settings |
| **Moderator** | Edit in assigned areas/modules |
| **User** | View (and limited edit per permissions) |

If a menu is missing, ask your Super Admin to check **Module Permissions** and **Area Assignments**.

## 1.5 KPI colours (used everywhere)

| Colour | Meaning |
|--------|---------|
| 🟢 **Green** | On track — within SLA |
| 🟠 **Orange** | Priority — approaching deadline |
| 🔴 **Red** | Overdue — past SLA target |

![KPI colour legend — green on track, orange priority, red overdue](images/kpi-legend.svg)

---

# Part II — Using the Application (Step by Step)

## 2.1 Dashboard

**Menu:** Main → **Dashboard**

**Purpose:** Command centre with totals, alerts, and quick links.

**Steps:**
1. Click **Dashboard** in the sidebar.
2. Review KPI cards: trucks in DRC, NB/SB outstanding, POD pending.
3. Click any **stat card** to open a filtered list.
4. Check the **notification bell** for overdue items.
5. Use quick links to jump to NB, SB, Border, or POD.

---

## 2.2 NB Operations (Northbound)

**Menu:** Operations → **NB Operations**

**Workflow order:** Border → Kanyaka → Offloading → POD

![NB Operations workflow diagram](images/nb-workflow.svg)

### Upload today's NB live file

1. Open **NB Operations**.
2. Click **📤 Upload NB Live File**.
3. Select your CSV/Excel file (use **Download NB Template** or `samples/NB_Live_Template.csv`).
4. Confirm upload — trucks appear in the table.

### Update a truck status

1. Find the truck row (use **Search** or filters: area, border, KPI).
2. Click the **workflow status cell** or **💬 Comment**.
3. In the comment modal, choose status and date; add notes.
4. Submit — the column updates with date and user.

### Use column manager

1. Click **Columns** in the table header.
2. Show/hide columns; freeze key columns for scrolling.
3. Preferences save in your browser per page.

### Open truck on map

- If the truck has GPS and a position cell shows **📍**, click it to open the truck position map.

---

## 2.3 SB Operations (Southbound)

**Menu:** Operations → **SB Operations**

**Workflow order:** Loading → Documents → Seal → Escort → Dispatch → Kanyaka → Border Exit

![SB Operations workflow diagram](images/sb-workflow.svg)

**Steps:** Same pattern as NB Operations:
1. **Upload SB Live File**
2. Filter and search trucks
3. Update workflow columns via status cells or **💬 Comment**
4. Use **Columns** toolbar to customise the table

---

## 2.4 Border Clearance

**Menu:** Operations → **Border Clearance**

**Purpose:** Dedicated NB and SB border tables with per-step clearance columns.

**Steps:**
1. Open **Border Clearance**.
2. Switch between **NB** and **SB** tabs/tables.
3. Update each clearance step as trucks progress (KBP, Whisky, Direct, etc.).
4. Click a **driver name** to register or view driver in **Driver Registry**.
5. Review KPI cards for Kasumbalesa, Sakania, Mokambo.

---

## 2.5 POD Management

**Menu:** Operations → **POD Management**

**Pipeline:** Collect → Scan → Upload → Send to Invoicing

**Steps:**
1. Open **POD Management**.
2. Filter by area, KPI, or POD stage.
3. Advance each truck through POD stages using row actions or **💬 Comment**.
4. Overdue PODs show red KPI and appear in Dashboard alerts.

---

## 2.6 Area Trucks

**Menu:** Areas → **Area Trucks**

**Purpose:** View trucks for your assigned geographic areas only.

**Steps:**
1. Open **Area Trucks**.
2. Select or filter by area (Kanyaka, Kolwezi, Kasumbalesa, etc.).
3. Use the same live table format as NB/SB with workflow columns and comments.

---

## 2.7 Communication Matrix

**Menu:** Communication → **Communication Matrix**

**Purpose:** Contact directory by function and area.

**Steps:**
1. Open **Communication Matrix**.
2. Browse tabs: Contacts, Companies, Functions, Areas.
3. Click **+ Add** to create a contact (name, company, function, phone, area).
4. Use filters to find clearing agents, border officers, dispatchers.

---

## 2.8 Driver Registry

**Menu:** Communication → **Driver Registry**

**Purpose:** Register NB drivers at border with mobile/WhatsApp.

**Steps:**
1. Open **Driver Registry**.
2. Click **+ Register Driver** (or register from Border Clearance driver link).
3. Enter: name, truck plate, DRC mobile, WhatsApp, border, notes.
4. Save — driver appears in clearance and contact links.

---

## 2.9 Internal Communication

**Menu:** Communication → **Internal Communication**

**Purpose:** Team email and chat.

**Steps:**
1. Open **Internal Communication**.
2. **Email tab:** inbox, sent, drafts — compose, reply, attach files.
3. **Chat tab:** border rooms, area rooms, direct messages.
4. Link messages to trips or modules where available.

---

## 2.10 Helpdesk

**Menu:** Communication → **Helpdesk**

**Purpose:** Log web app issues; technical team manages SLA queue.

![Helpdesk workflow — user reports issue, tech team resolves, SLA KPI tracked](images/helpdesk-workflow.svg)

### Report a new issue (any user)

1. Open **Helpdesk**.
2. Click **+ Report Issue**.
3. Fill in:
   - **Subject** (required)
   - **Description** (required) — what happened, steps to reproduce
   - **Category** — Bug, Access, Data, Workflow, etc.
   - **Priority** — low, normal, high, urgent
4. Page/module and area are captured automatically.
5. Click **💾 Save Issue**.
6. Note your **ticket number** (e.g. HD-10001) and **target resolve time**.

### Track your issues

1. Stay on **My Issues** tab (default for regular users).
2. Columns show: **Logged**, **Target Resolve**, **First Response**, **SLA/KPI** badges.
3. Click **View** to see details and add comments.

### Team queue (Super Admin / Manager)

1. Open **Helpdesk**.
2. Click **Team Queue** tab.
3. Assign tickets, change status, add comments or **internal notes**.
4. Click **✓** to quick-resolve.
5. Configure SLA under **Admin → Helpdesk SLA Settings**.

---

## 2.11 Clients

**Menu:** Management → **Clients**

**Purpose:** Customer register (CRM) for FMS.

**Steps:**
1. Open **Clients**.
2. Click **+ Add Client**.
3. Enter: name, contact person, phone, WhatsApp, email, address.
4. Set status **Active**.
5. Save — client appears in Client Orders dropdowns.

---

## 2.12 Route Catalog

**Menu:** Management → **Route Catalog**

**Purpose:** Define routes before creating orders.

**Steps:**
1. Open **Route Catalog**.
2. **Countries** — add countries if needed.
3. **Stations** — add stations per country with loading/offloading points.
4. **Route Templates** — create domestic (same country) or international (cross-border) routes.
5. For international routes, set border fields (entry, exit, via borders).
6. Save each section — Client Orders pull from this catalog.

---

## 2.13 Client Orders

**Menu:** Management → **Client Orders**

![FMS workflow — Clients → Route Catalog → Client Orders → Trip Scheduler → Fleet Registry](images/fms-workflow.svg)

**Purpose:** Full FMS order form linked to routes and trip scheduler.

### Create an order

1. Open **Client Orders**.
2. Click **+ New Order** (or Create).
3. Complete tabs:
   - **Header** — client, dates, priority, status, references
   - **Route** — origin/destination, loading/offloading points, borders
   - **Cargo** — commodity, cargo type (Bulk, Container, OOG), weights, containers
   - **Parties** — shipper, consignee, invoice party
4. Click **Save Order**.

### Allocate a truck to an order

1. Find the order in the grid.
2. Click **Schedule Truck** (or allocate action).
3. Select a **fleet set** (truck + trailer + driver).
4. Set scheduled date → **Allocate**.

### Filter orders

Use the filter bar: shipper, status, dates, container number, cargo type, etc.

---

## 2.14 Trip Scheduler

**Menu:** Management → **Trip Scheduler**

**Purpose:** Assign fleet sets to one or more client orders on a trip.

**Steps:**
1. Open **Trip Scheduler**.
2. Click **+ New Trip** or select existing trip.
3. Set trip header: reference, loading date, transporter, fleet set.
4. In the **order lines** section, select a **Client Order** from the dropdown.
5. Route, cargo, borders, commodity, and container details **auto-fill**.
6. Add more order lines if multi-order trips are allowed.
7. Click **Save Trip** — orders link to the trip and status becomes **allocated**.

---

## 2.15 Fleet Registry

**Menu:** Management → **Fleet Registry**

**Purpose:** Register trucks, trailers, drivers, and fleet sets with GPS.

### Register a truck

1. Open **Fleet Registry** → **Trucks** tab (or **+ Truck**).
2. Enter plate, make, model, capacity, owner, fleet number, FMS details.
3. Save.

### Register a trailer

1. Click **+ Trailer**.
2. Enter plate, type (standard, superlink front/rear), capacity.
3. For superlink: use **🔗 Superlink Pair** to link front + rear.

### Register a driver

1. Click **+ Driver**.
2. Enter name, DRC mobile, WhatsApp, license number.
3. Save.

### Create a fleet set

1. Click **+ Fleet Set**.
2. Select truck, trailer, driver.
3. **GPS tracking** — enter device ID, latitude, longitude, location label.
4. Save — fleet set is available for Client Orders and Trip Scheduler.

### View on map

- Click **📍 Map** on a fleet set with GPS, or open **Fleet Map** for all trucks.

---

## 2.16 Fleet Map

**Menu:** Management → **Fleet Map**

**Purpose:** Interactive map of all trucks with GPS coordinates.

![Fleet Map — click a GPS pin to view truck details and open position map](images/fleet-map.svg)

**Steps:**
1. Open **Fleet Map**.
2. See pins for each truck with GPS.
3. **Click a pin** — popup shows plate, driver, location, status.
4. Click **Truck detail map** for a focused single-truck view.
5. Use the table below to click **📍 Pin** and focus a specific truck.
6. Click **↻ Refresh** after GPS updates.

---

## 2.17 Position Live

**Menu:** Management → **Position Live**

**Purpose:** Master live view with position uploads and workflow columns.

**Steps:**
1. Open **Position Live**.
2. Click **🗺️ Fleet Map** for all truck positions.
3. **Upload Position File** — typically 3× daily (morning, afternoon, evening).
4. Upload **NB** or **SB Live File** from the same page if needed.
5. Search and filter by direction (NB/SB).
6. Click position cells with **📍** to open truck GPS map.

---

## 2.18 Assets & Equipment

**Menu:** Management → **Assets & Equipment**

**Steps:**
1. Open **Assets & Equipment**.
2. Click **+ Add Asset** — vehicle, phone, radio, etc.
3. Track documents, expiry dates, status, handovers.
4. Filter by type, status, expiry alerts.

---

## 2.19 Runner Fees

**Menu:** Management → **Runner Fees**

**Steps:**
1. Open **Runner Fees**.
2. Select transporter and date range.
3. Review border dwell and Kanyaka transit fee calculations.
4. Export or print summary as needed.

---

## 2.20 Reports

**Menu:** Management → **Reports**

### Single-module report

1. Open **Reports**.
2. Pick a module (NB, SB, Border, POD, etc.).
3. Select columns and filters.
4. View KPI summary and detail table.
5. Export CSV if available.

### Cross-menu custom report

1. Go to **Cross-Menu Custom Report**.
2. Select fields from multiple menus (e.g. NB + Border + POD).
3. Apply shared filters: direction, KPI, area, border, search.
4. **Save layout** for reuse (stored in your browser).

---

## 2.21 Turnarounds

**Menu:** Management → **Turnarounds**

**Purpose:** NB→SB journey on the same truck.

**Steps:**
1. Open **Turnarounds**.
2. Review summary KPI cards.
3. Filter by status, transporter, date range, same-truck policy.
4. Expand a row for full NB/SB timeline.
5. Same-truck policy is set under **Admin → Fleet — Same Truck for SB**.

---

## 2.22 Comments and process guide

On any trip row in operations tables:

1. Click **💬 Comment**.
2. View comment history and workflow timeline.
3. Choose **Normal Comment** or **Problem Report**.
4. Pick a new status and **status date** if updating workflow.
5. Use the **process guide** panel to see the next expected step.

---

# Part III — Help Assistant (Chatbot)

![Help assistant chatbot — ask questions, use quick chips, get step-by-step answers](images/help-assistant.svg)

## 3.1 Opening the help assistant

1. Look for the **Help** button or chat icon (usually bottom-right of the screen).
2. Click to open the help panel.
3. Type your question in the text box.
4. Press **Enter** or click **Send**.

## 3.2 What the assistant can do

| You can ask about | Example questions |
|-------------------|-------------------|
| Any menu | "What is Trip Scheduler?" |
| Workflows | "NB workflow steps" |
| Border processes | "KBP process" |
| How to update status | "How do I update truck status?" |
| Your access | "What can I access?" |
| FMS modules | "How do client orders work?" |
| Helpdesk | "How do I report an issue?" |
| Admin (if permitted) | "KPI settings" |

## 3.3 Quick chips

The assistant shows **quick suggestion chips** (e.g. "Menu guide", "NB workflow", "My access"). Click a chip to get an instant answer without typing.

## 3.4 Menu guide

Ask: **"Show me all menus"** or **"menu guide"**

The assistant lists every menu you have access to, with a short description. Menus you cannot access are marked 🔒 — contact your Admin.

## 3.5 Context-aware help

The assistant knows:
- Your **role** and **username**
- Your **assigned areas**
- Which **modules** you can view and edit
- Which **page** you are currently on

Ask **"help with this page"** while on any screen for page-specific guidance.

## 3.6 Admin topics

If you ask about admin features (users, roles, KPI settings) without permission, the assistant explains that access is restricted and tells you to contact your Admin.

## 3.7 Tips for best results

- Use keywords: "POD", "upload", "border", "trip scheduler", "fleet map"
- Be specific: "How do I upload NB live file?" works better than "upload"
- For workflows, ask "NB workflow" or "SB workflow"
- For access issues, ask "What can I access?"

---

# Part IV — Administrator Guide (Step by Step)

*Super Admin and authorised Managers only.*

## 4.1 Recommended setup order

Configure the system in this order for a new production deployment:

![Recommended admin setup order — users, roles, permissions, KPI, FMS, master data](images/admin-setup-order.svg)

```
1. Manage Users          → create real accounts, change passwords
2. Role Manager          → review role permissions
3. System Settings       → app name, session, maintenance off
4. Themes                → pick company theme
5. Area Status Lists     → valid statuses per area
6. Area Assignments      → assign users to areas
7. Module Permissions    → view/edit/delete per module
8. KPI Settings          → SLA hours per workflow step
9. Helpdesk SLA Settings → support ticket targets
10. Freight & FMS Settings → order/trip/fleet rules
11. Fleet — Same Truck   → turnaround policy
12. Upload Templates     → CSV column mappings
13. Route Catalog        → countries, stations, routes
14. Clients + Fleet      → master data
```

---

## 4.2 Admin → Manage Users

**Path:** Sidebar → Admin → **Manage Users**

**Who can access:** Users with `manage_users` permission (Super Admin, Manager).

### Create a new user

1. Open **Manage Users**.
2. Click **+ Add User**.
3. Fill in:
   - **Username** (login name)
   - **Email**
   - **Password** (or leave for admin reset)
   - **Role** — Super Admin, Manager, Moderator, User
   - **Area** — primary area
   - **Assigned areas** — all areas this user can see
4. Set status **Active**.
5. Click **Save**.

### Edit or deactivate a user

1. Find the user in the table (use search).
2. Click **Edit**.
3. Change role, areas, or status.
4. Set **Banned** to block login.
5. Save.

### Reset password

1. Edit the user.
2. Enter a new password.
3. Save — user must use new password on next login.

---

## 4.3 Admin → Role Manager

**Path:** Admin → **Role Manager**

**Who can access:** Users with `manage_roles` permission.

### Review a role

1. Open **Role Manager**.
2. See roles: Super Admin, Manager, Moderator, User.
3. Click a role to view permissions:
   - `read_all` / `read_own`
   - `create`, `edit_all`, `edit_limited`
   - `manage_users`, `manage_settings`, `manage_roles`
   - `view_logs`, `delete`

### Edit role permissions

1. Select the role.
2. Toggle permissions checkboxes.
3. Save — affects all users with that role.

> **Note:** Super Admin role should not be restricted in production.

---

## 4.4 Admin → System Settings

**Path:** Admin → **System Settings**

### Access & sign-ups

| Setting | Recommended production value | What it does |
|---------|------------------------------|--------------|
| **Allow User Sign-ups** | OFF | Only admins create accounts |
| **Maintenance Mode** | OFF | When ON, only Super Admin can log in |
| **Session Timeout** | 30–60 minutes | Auto logout after inactivity |
| **Max Login Attempts** | 5–10 | Brute-force protection |

### Business config

| Setting | What to enter |
|---------|---------------|
| **Default Interest Rate** | Your finance rate if used |
| **Support Email** | IT/help email shown to users |
| **Application Name** | Your company app name |

### Database backup

| Setting | Recommendation |
|---------|----------------|
| **Backup Schedule** | Daily |
| **Retention** | 30–90 days |
| **Run Manual Backup** | Click before major changes |

---

## 4.5 Admin → Themes

**Path:** Admin → **Themes**

**Steps:**
1. Open **Themes**.
2. Browse theme cards: Ocean Blue, Midnight Pro, Forest Logistics, Copper Haul, Arctic Light, Royal Purple.
3. Click a theme — applies instantly.
4. Active theme shows a ✓ badge.
5. Selection saves automatically per browser/device.

---

## 4.6 Admin → KPI Settings

**Path:** Admin → **KPI Settings**

**Purpose:** Set SLA target hours for workflow steps, borders, POD, and modules.

**Steps:**
1. Open **KPI Settings**.
2. Use category filter: NB, SB, Border, POD, Position Live, Helpdesk, etc.
3. For each step row, set:
   - **Target value** (hours or days)
   - **Unit** (hours/days)
   - **Notes** (optional)
4. Click **💾 Save All**.
5. KPI colours (green/orange/red) across the app use these targets.

**Key areas to configure:**
- NB workflow steps (Border, Kanyaka, Offloading, POD)
- SB workflow steps (Loading through Border Exit)
- Border processes (KBP, Whisky, Direct per border)
- POD stages (Collect, Scan, Upload, Invoicing)
- Helpdesk first response and resolution (also in Helpdesk SLA Settings)

---

## 4.7 Admin → Helpdesk SLA Settings

**Path:** Admin → **Helpdesk SLA Settings**

**Steps:**
1. Open **Helpdesk SLA Settings**.
2. For each priority (urgent, high, normal, low), set:
   - **First Response (hrs)** — time for technical team to first reply
   - **Resolution Target (hrs)** — time to resolve the issue
3. Click **💾 Save SLA Settings**.
4. Tickets show KPI badges based on these targets.

**Default reference:**

| Priority | First response | Resolution |
|----------|----------------|------------|
| Urgent | 1 hour | 4 hours |
| High | 2 hours | 8 hours |
| Normal | 4 hours | 24 hours |
| Low | 8 hours | 48 hours |

---

## 4.8 Admin → Audit Logs

**Path:** Admin → **Audit Logs**

**Steps:**
1. Open **Audit Logs**.
2. Search by username, action, or target ID.
3. Filter by date.
4. Review: who did what, when, from which IP.
5. Use weekly for security and compliance reviews.

---

## 4.9 Admin → Area Status Lists

**Path:** Admin → **Area Status Lists**

**Purpose:** Define valid status names per geographic area for NB, SB, and border workflows.

**Steps:**
1. Open **Area Status Lists**.
2. Select an area (Kasumbalesa, Kanyaka, Kolwezi, Sakania, Mokambo, etc.).
3. Select workflow type (NB, SB, Border).
4. Add, edit, or reorder status names.
5. Save — these appear in status dropdowns on operations pages.

---

## 4.10 Admin → Area Assignments

**Path:** Admin → **Area Assignments**

**Steps:**
1. Open **Area Assignments**.
2. Search for a user.
3. Check the areas that user can see and work on.
4. Save — moderators and users only see data for assigned areas.

**Example:**
- Border moderator → Kasumbalesa, Sakania only
- Kanyaka dispatcher → Kanyaka only
- Manager → All Areas

---

## 4.11 Admin → Module Permissions

**Path:** Admin → **Module Permissions**

**Purpose:** Fine-grained **View / Edit / Delete** per module and per area for each user.

![Module permissions matrix — view, edit, delete per module and area](images/module-permissions.svg)

**Steps:**
1. Open **Module Permissions**.
2. Select a user from the list.
3. For each module (NB Operations, SB Operations, Client Orders, Helpdesk, Fleet Map, etc.):
   - Set **View** — can see the menu and data
   - Set **Edit** — can update statuses, comments, uploads
   - Set **Delete** — can remove records
4. Configure per area for area-scoped modules.
5. Click **💾 Save Permissions**.

**Typical patterns:**
- **Dispatcher** — View+Edit on NB, SB, Position Live
- **Border moderator** — View+Edit on Border Clearance for their border area
- **FMS clerk** — View+Edit on Client Orders, Trip Scheduler, Fleet Registry
- **Read-only manager** — View only on Reports and Dashboard

---

## 4.12 Admin → Fleet — Same Truck for SB

**Path:** Admin → **Fleet — Same Truck for SB**

**Purpose:** Control whether the same physical truck must continue on the SB leg after an NB turnaround.

**Steps:**
1. Open **Fleet — Same Truck for SB**.
2. See list of **fleet owners**.
3. Toggle **Require same truck for SB** per owner:
   - **ON** — turnaround must use same truck plate for SB
   - **OFF** — different truck may be assigned for SB
4. Changes save automatically when backend is connected.

---

## 4.13 Admin → Freight & FMS Settings

**Path:** Admin → **Freight & FMS Settings**

### Trip Scheduler section

| Setting | Description |
|---------|-------------|
| **Default Transporter** | Pre-fills transporter on new trips |
| **Default Loading Time** | Default time on trip form |
| **Max Orders per Trip** | Limit orders on one trip |
| **Allow multiple client orders per trip** | Multi-order trips |
| **Auto-allocate orders when trip is saved** | Marks orders allocated automatically |
| **Link trip cargo to Client Orders dropdown** | Enables order dropdown auto-fill |

### Client Orders section

| Setting | Description |
|---------|-------------|
| **Order Number Prefix** | e.g. `GG-` for auto-generated numbers |
| **Default New Order Status** | draft, confirmed, etc. |
| **Auto-generate order number** | ON for automatic numbering |
| **Require catalog routes for orders** | Orders must use Route Catalog |
| **Allow manual route selection** | Allow free-text routes |

### Fleet Registry section

| Setting | Description |
|---------|-------------|
| **Require driver on fleet set** | Fleet set must have a driver |
| **Allow superlink pairing** | Enable front/rear trailer pairs |
| **Show Full FMS Register tab** | Show ~87 column register |
| **Lock linked fleet assets** | Prevent editing assets in active sets |

**Steps:**
1. Open **Freight & FMS Settings**.
2. Adjust toggles and fields per section.
3. Click **💾 Save All Settings**.

---

## 4.14 Admin → Upload Templates

**Path:** Admin → **Upload Templates**

**Who can access:** Super Admin only.

**Purpose:** Define which columns appear in NB/SB live and position upload files.

**Steps:**
1. Open **Upload Templates**.
2. Select template type: **NB**, **SB**, or **POSITION**.
3. Review/edit column list and mappings.
4. Save template.
5. Users download templates from operations pages matching these columns.

---

# Part V — First-Time Production Setup

## 5.1 Server configuration (`.env`)

1. Copy `.env.example` to `.env`.
2. Set `JWT_SECRET` (32+ random characters) — **required**.
3. First install: `RUN_SEED=true`.
4. After first login: `RUN_SEED=false`.
5. Set `DEFAULT_ADMIN_PASSWORD` before first seed if desired.
6. Start: `docker compose up -d --build`.

See [INSTALLATION.md](INSTALLATION.md) for full platform guides.

## 5.2 Day-one admin checklist

| Step | Action | Where |
|------|--------|-------|
| 1 | Log in as super_admin | Login page |
| 2 | Change all default passwords | Admin → Manage Users |
| 3 | Set RUN_SEED=false | Server `.env` + restart |
| 4 | Set app name and support email | Admin → System Settings |
| 5 | Pick theme | Admin → Themes |
| 6 | Configure KPI SLA hours | Admin → KPI Settings |
| 7 | Configure helpdesk SLA | Admin → Helpdesk SLA Settings |
| 8 | Create real user accounts | Admin → Manage Users |
| 9 | Assign areas | Admin → Area Assignments |
| 10 | Set module permissions | Admin → Module Permissions |
| 11 | Configure FMS settings | Admin → Freight & FMS Settings |
| 12 | Add clients | Management → Clients |
| 13 | Build route catalog | Management → Route Catalog |
| 14 | Register fleet | Management → Fleet Registry |
| 15 | Test helpdesk ticket | Communication → Helpdesk |
| 16 | Test NB upload | NB Operations |

## 5.3 Security checklist

- [ ] Strong `JWT_SECRET` in `.env`
- [ ] `RUN_SEED=false` after setup
- [ ] All default passwords changed
- [ ] Sign-ups disabled (System Settings)
- [ ] HTTPS in front of app for internet access
- [ ] `CORS_ORIGIN` set to your domain
- [ ] Regular database backups
- [ ] Audit logs reviewed weekly

---

# Part VI — Daily Operations & Troubleshooting

## 6.1 Morning checklist (operations desk)

| Time | Task | Menu |
|------|------|------|
| Start of shift | Check Dashboard alerts | Dashboard |
| Morning | Upload NB live file | NB Operations |
| Morning | Upload SB live file | SB Operations |
| Morning | Upload 1st position file | Position Live |
| Ongoing | Update border clearance | Border Clearance |
| Ongoing | Register new drivers | Driver Registry |
| Midday / evening | Upload 2nd & 3rd position files | Position Live |
| End of shift | Advance POD stages | POD Management |
| As needed | Schedule trips / orders | Trip Scheduler |
| As needed | Report app issues | Helpdesk |

## 6.2 Who does what

| Task | Typical role |
|------|-------------|
| NB/SB live upload | Operations dispatcher |
| Border status updates | Border moderator |
| Kanyaka / offloading | Area moderator |
| POD stages | POD team |
| Client orders & trips | FMS clerk / dispatcher |
| Fleet registration | Fleet admin |
| User/role changes | Super Admin |
| KPI/SLA changes | Super Admin / Manager |

## 6.3 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot sign in | Check username/password; ask admin to reset |
| Menu missing | Admin checks Module Permissions + Area Assignments |
| Upload has no effect | Must be logged in; check CSV matches template |
| Position not on NB/SB | Trip number AND truck plate must match live file |
| Management menus blank | Rebuild Docker: `docker compose up -d --build` |
| Helpdesk quick resolve wiped data | Update to v2.2.0+ |
| Fleet map empty | Add GPS lat/lng in Fleet Registry fleet sets |
| KPI always red | Admin adjusts targets in KPI Settings |
| Page blank / errors | Hard refresh (Ctrl+F5); check browser console |

## 6.4 Health check

```bash
curl http://localhost:3001/api/health
```

Expected: `"status":"ok"` and `"requireAuth":true` for production.

---

## Document control

| Field | Value |
|-------|-------|
| Manual title | TruckControl Complete User & Administrator Manual |
| Version | v2.2.1-production |
| Illustrations | `docs/images/*.svg` (12 diagrams) |
| Last updated | August 2026 |
| Related | INSTALLATION.md, USER-GUIDE.md, PRODUCTION.md |

---

*End of manual*
