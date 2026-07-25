import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  Download,
  FileBarChart,
  FileText,
  Filter,
  Gauge,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  Upload,
  UserRound,
  UsersRound,
  Warehouse,
  X,
  type LucideIcon,
} from 'lucide-react'

type StatusTone = 'green' | 'orange' | 'red'

type TruckRecord = {
  truck: string
  trip: string
  direction: 'NB' | 'SB'
  route: string
  area: string
  stage: string
  elapsed: string
  timeValue: number
  target: string
  status: StatusTone
  statusLabel: string
  nextAction: string
  assignee: string
  initials: string
}

const trucks: TruckRecord[] = [
  {
    truck: 'ALX 4738',
    trip: 'TRP-240718',
    direction: 'NB',
    route: 'Sakania → Kolwezi',
    area: 'Sakania',
    stage: 'Border clearance',
    elapsed: '52h 18m',
    timeValue: 52,
    target: '48h',
    status: 'red',
    statusLabel: 'Overdue',
    nextAction: 'Collect TR8 documents',
    assignee: 'Patrick M.',
    initials: 'PM',
  },
  {
    truck: 'BTR 9102',
    trip: 'TRP-240731',
    direction: 'SB',
    route: 'Tenke → Kasumbalesa',
    area: 'Tenke',
    stage: 'Loading process',
    elapsed: '42h 06m',
    timeValue: 42,
    target: '48h',
    status: 'orange',
    statusLabel: 'Priority',
    nextAction: 'Confirm seal readiness',
    assignee: 'Grace K.',
    initials: 'GK',
  },
  {
    truck: 'ZMB 2281',
    trip: 'TRP-240729',
    direction: 'NB',
    route: 'Kanyaka → Kisanfu',
    area: 'Kanyaka',
    stage: 'POD collection',
    elapsed: '38h 44m',
    timeValue: 38,
    target: '48h',
    status: 'orange',
    statusLabel: 'Priority',
    nextAction: 'Upload signed POD',
    assignee: 'Joel T.',
    initials: 'JT',
  },
  {
    truck: 'ACR 5540',
    trip: 'TRP-240744',
    direction: 'SB',
    route: 'Kolwezi → Kanyaka',
    area: 'Kolwezi',
    stage: 'Dispatch / escort',
    elapsed: '4d 11h',
    timeValue: 107,
    target: '8d',
    status: 'green',
    statusLabel: 'On time',
    nextAction: 'Confirm escort arrival',
    assignee: 'Mireille B.',
    initials: 'MB',
  },
  {
    truck: 'TFR 1839',
    trip: 'TRP-240752',
    direction: 'NB',
    route: 'Mokambo → Lubumbashi',
    area: 'Mokambo',
    stage: 'Border clearance',
    elapsed: '19h 32m',
    timeValue: 19,
    target: '72h',
    status: 'green',
    statusLabel: 'On time',
    nextAction: 'Await IM4 issuance',
    assignee: 'Daniel L.',
    initials: 'DL',
  },
  {
    truck: 'KLP 7732',
    trip: 'TRP-240726',
    direction: 'SB',
    route: 'Kambove → Kanyaka',
    area: 'Kambove',
    stage: 'Following-on list',
    elapsed: '2h 28m',
    timeValue: 2.5,
    target: '2h',
    status: 'red',
    statusLabel: 'Overdue',
    nextAction: 'Release Kanyaka list',
    assignee: 'Sarah N.',
    initials: 'SN',
  },
]

const performance = [
  { label: 'Kasumbalesa', value: 91, count: 42 },
  { label: 'Kolwezi', value: 84, count: 28 },
  { label: 'Kanyaka', value: 78, count: 37 },
  { label: 'Sakania', value: 72, count: 19 },
  { label: 'Lubumbashi', value: 66, count: 24 },
]

const chartData = [
  { label: 'Mon', nb: 58, sb: 45 },
  { label: 'Tue', nb: 64, sb: 52 },
  { label: 'Wed', nb: 53, sb: 61 },
  { label: 'Thu', nb: 72, sb: 58 },
  { label: 'Fri', nb: 68, sb: 65 },
  { label: 'Sat', nb: 77, sb: 69 },
  { label: 'Sun', nb: 81, sb: 74 },
]

type NavItem = { id: string; label: string; icon: LucideIcon; count?: number }

const primaryNav: NavItem[] = [
  { id: 'dashboard', label: 'Control tower', icon: LayoutDashboard },
  { id: 'northbound', label: 'North bound', icon: ArrowUpRight, count: 84 },
  { id: 'southbound', label: 'South bound', icon: ArrowDownRight, count: 62 },
  { id: 'pod', label: 'POD management', icon: PackageCheck, count: 12 },
  { id: 'areas', label: 'Area operations', icon: Building2 },
]

const secondaryNav: NavItem[] = [
  { id: 'fleet', label: 'Fleet & assets', icon: Truck },
  { id: 'equipment', label: 'Equipment', icon: Boxes },
  { id: 'communication', label: 'Communication', icon: MessageSquareText },
  { id: 'runner', label: 'Runner fees', icon: CircleDollarSign },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
]

const titles: Record<string, { title: string; eyebrow: string }> = {
  dashboard: { title: 'Operations control tower', eyebrow: 'Live overview' },
  northbound: { title: 'North bound operations', eyebrow: 'Border to POD' },
  southbound: { title: 'South bound operations', eyebrow: 'Loading to exit' },
  pod: { title: 'POD management', eyebrow: 'Proof of delivery' },
  areas: { title: 'Area operations', eyebrow: 'Regional performance' },
  fleet: { title: 'Fleet & assets', eyebrow: 'Vehicle register' },
  equipment: { title: 'Equipment management', eyebrow: 'Assignments & maintenance' },
  communication: { title: 'Communication centre', eyebrow: 'Teams & messages' },
  runner: { title: 'Runner fee control', eyebrow: 'Fees & calculations' },
  reports: { title: 'Reports & exports', eyebrow: 'Operational intelligence' },
}

function App() {
  const [active, setActive] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const page = titles[active] ?? titles.dashboard

  const selectPage = (id: string) => {
    setActive(id)
    setSidebarOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand__mark"><Route size={23} /></div>
          <div>
            <div className="brand__name">TransFlow</div>
            <div className="brand__sub">Operations control</div>
          </div>
          <button className="icon-button sidebar__close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          <div className="nav-label">Operations</div>
          {primaryNav.map((item) => (
            <NavButton key={item.id} item={item} active={active === item.id} onClick={() => selectPage(item.id)} />
          ))}

          <div className="nav-label nav-label--spaced">Management</div>
          {secondaryNav.map((item) => (
            <NavButton key={item.id} item={item} active={active === item.id} onClick={() => selectPage(item.id)} />
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="nav-item" onClick={() => selectPage('settings')}>
            <Settings size={19} />
            <span>Settings</span>
          </button>
          <div className="support-card">
            <div className="support-card__icon"><ShieldCheck size={18} /></div>
            <div>
              <strong>Systems operational</strong>
              <span>Last sync 2 min ago</span>
            </div>
            <span className="live-dot" />
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="main">
        <header className="topbar">
          <div className="topbar__left">
            <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
              <Menu size={21} />
            </button>
            <div className="page-title">
              <span>{page.eyebrow}</span>
              <h1>{page.title}</h1>
            </div>
          </div>
          <div className="topbar__actions">
            <label className="global-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search truck, trip or driver"
                aria-label="Global search"
              />
              <span className="keyboard-hint"><Command size={11} /> K</span>
            </label>
            <button className="icon-button notification-button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications">
              <Bell size={19} />
              <span className="notification-dot">3</span>
            </button>
            <button className="profile-button">
              <span className="avatar avatar--main">AM</span>
              <span className="profile-button__copy"><strong>Alex Morgan</strong><small>Operations manager</small></span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        {notificationsOpen && <NotificationPanel close={() => setNotificationsOpen(false)} />}

        <div className="content">
          {active === 'dashboard' ? (
            <Dashboard search={search} openUpdate={() => setUpdateOpen(true)} openOperations={selectPage} />
          ) : (
            <ModulePage active={active} search={search} openUpdate={() => setUpdateOpen(true)} />
          )}
        </div>
      </main>

      {updateOpen && <UpdateModal close={() => setUpdateOpen(false)} />}
    </div>
  )
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon
  return (
    <button className={`nav-item ${active ? 'nav-item--active' : ''}`} onClick={onClick}>
      <Icon size={19} />
      <span>{item.label}</span>
      {item.count && <span className="nav-count">{item.count}</span>}
    </button>
  )
}

function Dashboard({
  search,
  openUpdate,
  openOperations,
}: {
  search: string
  openUpdate: () => void
  openOperations: (id: string) => void
}) {
  const visibleTrucks = useMemo(
    () => trucks.filter((truck) => `${truck.truck} ${truck.trip} ${truck.area} ${truck.stage}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="welcome-row__date">Saturday, 25 July 2026 · 14:43 CAT</p>
          <h2>Good afternoon, Alex</h2>
          <p>Here’s what needs your attention across DRC operations.</p>
        </div>
        <div className="welcome-row__actions">
          <button className="button button--secondary"><Upload size={17} /> Import trips</button>
          <button className="button button--primary" onClick={openUpdate}><Plus size={18} /> Add status update</button>
        </div>
      </section>

      <section className="stat-grid" aria-label="Operational summary">
        <StatCard title="Live trucks in DRC" value="146" trend="+8.2%" trendUp icon={Truck} accent="teal" detail="84 NB · 62 SB" />
        <StatCard title="Within target" value="118" trend="80.8%" trendUp icon={CheckCircle2} accent="green" detail="5.4% above last week" />
        <StatCard title="Priority actions" value="19" trend="+4 today" icon={Clock3} accent="orange" detail="7 due within 4 hours" />
        <StatCard title="Overdue" value="9" trend="-12.5%" trendUp icon={AlertTriangle} accent="red" detail="3 require escalation" />
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <PanelHeader
            eyebrow="Turnaround performance"
            title="Weekly movement"
            action={<button className="select-button">Last 7 days <ChevronDown size={14} /></button>}
          />
          <div className="chart-legend">
            <span><i className="legend-dot legend-dot--nb" /> North bound</span>
            <span><i className="legend-dot legend-dot--sb" /> South bound</span>
            <strong>+6.8% <small>vs last week</small></strong>
          </div>
          <div className="bar-chart">
            {chartData.map((item) => (
              <div className="bar-group" key={item.label}>
                <div className="bar-group__bars">
                  <div className="bar bar--nb" style={{ height: `${item.nb}%` }}><span>{item.nb}</span></div>
                  <div className="bar bar--sb" style={{ height: `${item.sb}%` }}><span>{item.sb}</span></div>
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel area-panel">
          <PanelHeader
            eyebrow="By operational area"
            title="Area performance"
            action={<button className="text-button" onClick={() => openOperations('areas')}>View all <ArrowRight size={15} /></button>}
          />
          <div className="area-list">
            {performance.map((area, index) => (
              <button className="area-row" key={area.label} onClick={() => openOperations('areas')}>
                <span className="area-rank">{index + 1}</span>
                <span className="area-row__main">
                  <span><strong>{area.label}</strong><small>{area.count} active trucks</small></span>
                  <span className="area-score">{area.value}%</span>
                  <span className="progress-track"><i style={{ width: `${area.value}%` }} /></span>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="panel worklist-panel">
        <PanelHeader
          eyebrow="Live operations"
          title="Trucks requiring attention"
          action={
            <div className="panel-actions">
              <button className="filter-button"><Filter size={15} /> Filter <span>3</span></button>
              <button className="text-button" onClick={() => openOperations('northbound')}>View all trucks <ArrowRight size={15} /></button>
            </div>
          }
        />
        <TruckTable data={visibleTrucks} />
        {visibleTrucks.length === 0 && (
          <div className="empty-state"><Search size={24} /><strong>No trucks found</strong><span>Try another truck, trip, area, or status.</span></div>
        )}
      </section>
    </>
  )
}

function StatCard({
  title,
  value,
  trend,
  trendUp = false,
  icon: Icon,
  accent,
  detail,
}: {
  title: string
  value: string
  trend: string
  trendUp?: boolean
  icon: LucideIcon
  accent: string
  detail: string
}) {
  return (
    <article className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__top">
        <div className="stat-icon"><Icon size={20} /></div>
        <button className="more-button" aria-label={`More options for ${title}`}><MoreHorizontal size={18} /></button>
      </div>
      <div className="stat-card__label">{title}</div>
      <div className="stat-card__value-row">
        <strong>{value}</strong>
        <span className={trendUp ? 'trend trend--positive' : 'trend'}>{trendUp && <ArrowUpRight size={12} />}{trend}</span>
      </div>
      <div className="stat-card__detail">{detail}</div>
    </article>
  )
}

function PanelHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="panel-header">
      <div>
        <span className="panel-header__eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {action}
    </div>
  )
}

function TruckTable({ data }: { data: TruckRecord[] }) {
  return (
    <div className="table-wrap">
      <table className="truck-table">
        <thead>
          <tr>
            <th>Truck / Trip</th>
            <th>Route & area</th>
            <th>Current stage</th>
            <th>Time / target</th>
            <th>Status</th>
            <th>Next action</th>
            <th>Responsible</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.map((truck) => (
            <tr key={truck.trip}>
              <td>
                <div className="truck-id">
                  <span className={`direction direction--${truck.direction.toLowerCase()}`}>{truck.direction}</span>
                  <span><strong>{truck.truck}</strong><small>{truck.trip}</small></span>
                </div>
              </td>
              <td><div className="stacked"><strong>{truck.route}</strong><small>{truck.area} area</small></div></td>
              <td><span className="stage">{truck.stage}</span></td>
              <td><div className="stacked"><strong>{truck.elapsed}</strong><small>Target {truck.target}</small></div></td>
              <td><span className={`status status--${truck.status}`}><i /> {truck.statusLabel}</span></td>
              <td><span className="next-action">{truck.nextAction}</span></td>
              <td>
                <div className="assignee"><span className="avatar">{truck.initials}</span><span>{truck.assignee}</span></div>
              </td>
              <td><button className="row-action"><ChevronRight size={17} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ModulePage({ active, search, openUpdate }: { active: string; search: string; openUpdate: () => void }) {
  const meta = getModuleMeta(active)
  const filtered = trucks.filter((truck) => {
    const matchesSearch = `${truck.truck} ${truck.trip} ${truck.area} ${truck.stage}`.toLowerCase().includes(search.toLowerCase())
    if (active === 'northbound') return matchesSearch && truck.direction === 'NB'
    if (active === 'southbound') return matchesSearch && truck.direction === 'SB'
    if (active === 'pod') return matchesSearch && truck.stage.includes('POD')
    return matchesSearch
  })
  const Icon = meta.icon

  return (
    <>
      <section className="module-hero">
        <div className="module-hero__icon"><Icon size={26} /></div>
        <div className="module-hero__copy">
          <span>{meta.kicker}</span>
          <h2>{meta.heading}</h2>
          <p>{meta.description}</p>
        </div>
        <div className="module-hero__actions">
          <button className="button button--secondary"><Download size={17} /> Export</button>
          <button className="button button--primary" onClick={openUpdate}><Plus size={18} /> {meta.action}</button>
        </div>
      </section>

      <section className="mini-stats">
        {meta.stats.map((stat) => (
          <div className="mini-stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small className={stat.tone ? `text-${stat.tone}` : ''}>{stat.detail}</small>
          </div>
        ))}
      </section>

      <section className="panel module-panel">
        <div className="module-toolbar">
          <div className="tab-list">
            <button className="tab tab--active">Live records <span>{filtered.length}</span></button>
            <button className="tab">Completed</button>
            <button className="tab">All records</button>
          </div>
          <div className="module-toolbar__actions">
            <button className="filter-button"><Filter size={15} /> Filters</button>
            <button className="select-button">All areas <ChevronDown size={14} /></button>
          </div>
        </div>
        <TruckTable data={filtered.length ? filtered : trucks.slice(0, 4)} />
      </section>
    </>
  )
}

function getModuleMeta(active: string) {
  const defaultMeta = {
    icon: Gauge,
    kicker: 'Operational module',
    heading: titles[active]?.title ?? 'System settings',
    description: 'Monitor records, ownership, timing, and the next required action from one workspace.',
    action: 'Add record',
    stats: [
      { label: 'Active records', value: '146', detail: '+8 this week' },
      { label: 'On target', value: '80.8%', detail: '+5.4%', tone: 'green' },
      { label: 'Priority', value: '19', detail: '7 due soon', tone: 'orange' },
      { label: 'Overdue', value: '9', detail: '3 escalated', tone: 'red' },
    ],
  }
  const overrides: Record<string, Partial<typeof defaultMeta>> = {
    northbound: { icon: ArrowUpRight, kicker: 'NB workflow', heading: 'Border to proof of delivery', description: 'Track every north-bound truck through border clearance, Kanyaka, offloading, and POD handover.', action: 'Add NB update' },
    southbound: { icon: ArrowDownRight, kicker: 'SB workflow', heading: 'Loading point to Zambia exit', description: 'Control loading, dispatch, escort, Kanyaka, and border exit milestones.', action: 'Add SB update' },
    pod: { icon: PackageCheck, kicker: 'Document workflow', heading: 'Proof of delivery control', description: 'Collect, validate, upload, and hand over PODs to the invoicing team within target.', action: 'Upload POD' },
    areas: { icon: Warehouse, kicker: 'Area visibility', heading: 'Regional operations overview', description: 'Compare workload, turnaround performance, and ownership across all operational areas.', action: 'Configure area' },
    fleet: { icon: Truck, kicker: 'Asset register', heading: 'Fleet condition & compliance', description: 'Manage vehicles, documents, expiry dates, mileage, maintenance, and handovers.', action: 'Add vehicle' },
    equipment: { icon: Boxes, kicker: 'Equipment register', heading: 'Assignments & maintenance', description: 'Track equipment ownership, condition, returns, warranties, and supporting files.', action: 'Add equipment' },
    communication: { icon: UsersRound, kicker: 'Team workspace', heading: 'Operational communication', description: 'Keep official messages, contacts, groups, and linked trip documents in one place.', action: 'New message' },
    runner: { icon: CircleDollarSign, kicker: 'Fee administration', heading: 'Runner fee calculations', description: 'Calculate rates automatically by border, direction, owner, and turnaround duration.', action: 'Calculate fee' },
    reports: { icon: BarChart3, kicker: 'Management reporting', heading: 'Reports & data exports', description: 'Filter and export KPI, NB, SB, POD, fleet, equipment, and audit reports.', action: 'Create report' },
    settings: { icon: Settings, kicker: 'Administration', heading: 'System configuration', description: 'Configure users, rights, areas, KPI targets, statuses, document types, and audit controls.', action: 'Add configuration' },
  }
  return { ...defaultMeta, ...(overrides[active] ?? {}) }
}

function NotificationPanel({ close }: { close: () => void }) {
  return (
    <div className="notification-panel">
      <div className="notification-panel__header">
        <div><span>Priority centre</span><h3>Notifications</h3></div>
        <button className="icon-button" onClick={close}><X size={18} /></button>
      </div>
      <button className="notification-item">
        <span className="notification-icon notification-icon--red"><AlertTriangle size={17} /></span>
        <span><strong>Border clearance overdue</strong><small>ALX 4738 · Sakania · 4h 18m overdue</small><em>12 min ago</em></span>
      </button>
      <button className="notification-item">
        <span className="notification-icon notification-icon--orange"><Clock3 size={17} /></span>
        <span><strong>POD target approaching</strong><small>ZMB 2281 · 9h 16m remaining</small><em>28 min ago</em></span>
      </button>
      <button className="notification-item">
        <span className="notification-icon notification-icon--green"><Check size={17} /></span>
        <span><strong>Documents validated</strong><small>TRP-240749 · Cleared by Border Team</small><em>1 hour ago</em></span>
      </button>
      <button className="notification-footer">Open alert centre <ArrowRight size={15} /></button>
    </div>
  )
}

function UpdateModal({ close }: { close: () => void }) {
  const [saved, setSaved] = useState(false)
  if (saved) {
    return (
      <div className="modal-backdrop">
        <div className="modal modal--success">
          <div className="success-icon"><Check size={28} /></div>
          <h2>Status update saved</h2>
          <p>The trip timeline, current status, and audit log have been updated.</p>
          <button className="button button--primary" onClick={close}>Return to control tower</button>
        </div>
      </div>
    )
  }
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Add status update">
      <div className="modal">
        <div className="modal__header">
          <div><span>Live operations</span><h2>Add status update</h2><p>Record a milestone against an active trip.</p></div>
          <button className="icon-button" onClick={close}><X size={20} /></button>
        </div>
        <div className="form-grid">
          <label><span>Truck</span><select defaultValue=""><option value="" disabled>Select a truck</option>{trucks.map((item) => <option key={item.trip}>{item.truck}</option>)}</select></label>
          <label><span>Active trip</span><input placeholder="Auto-populated from truck" disabled /></label>
          <label><span>Workflow status</span><select defaultValue=""><option value="" disabled>Select status</option><option>Border clearance</option><option>Loading process</option><option>POD collection</option><option>Dispatch / escort</option></select></label>
          <label><span>Event date & time</span><input type="datetime-local" /></label>
          <label className="form-grid__wide"><span>Problem / situation</span><textarea placeholder="What is the current situation?" rows={2} /></label>
          <label><span>Person contacted</span><input placeholder="Name or team contacted" /></label>
          <label><span>Expected resolution</span><input type="datetime-local" /></label>
          <label className="form-grid__wide"><span>Solution / action taken</span><textarea placeholder="Describe the action already taken..." rows={2} /></label>
          <button className="upload-field form-grid__wide"><Upload size={19} /><span><strong>Attach supporting document</strong><small>PDF, Excel, JPG or PNG · Max 10 MB</small></span></button>
        </div>
        <div className="modal__footer">
          <button className="button button--secondary" onClick={close}>Cancel</button>
          <button className="button button--primary" onClick={() => setSaved(true)}>Save status update</button>
        </div>
      </div>
    </div>
  )
}

export default App
