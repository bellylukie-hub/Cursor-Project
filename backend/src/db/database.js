const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

const dataDir = env.dataDir;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'truckcontrol.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fleet_owners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      require_same_truck_sb INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trucks (
      id TEXT PRIMARY KEY,
      plate_number TEXT NOT NULL UNIQUE,
      trailer_plate TEXT,
      owner_id TEXT REFERENCES fleet_owners(id),
      assigned_driver TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS turnarounds (
      id TEXT PRIMARY KEY,
      truck_id TEXT NOT NULL REFERENCES trucks(id),
      nb_trip_id TEXT,
      sb_trip_id TEXT,
      same_truck_enforced INTEGER NOT NULL DEFAULT 1,
      status TEXT DEFAULT 'nb_active',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      trip_number TEXT NOT NULL UNIQUE,
      direction TEXT NOT NULL CHECK(direction IN ('NB', 'SB')),
      turnaround_id TEXT REFERENCES turnarounds(id),
      truck_id TEXT NOT NULL REFERENCES trucks(id),
      driver TEXT,
      owner TEXT,
      area TEXT,
      entry_border TEXT,
      exit_border TEXT,
      offloading_point TEXT,
      loading_point TEXT,
      border_process TEXT,
      status TEXT,
      kpi TEXT DEFAULT 'green',
      days_in_drc INTEGER DEFAULT 0,
      current_step_key TEXT,
      exit_to_zambia_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workflow_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id TEXT NOT NULL REFERENCES trips(id),
      step_key TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'current', 'completed')),
      started_at TEXT,
      completed_at TEXT,
      metadata TEXT,
      UNIQUE(trip_id, step_key)
    );

    CREATE TABLE IF NOT EXISTS border_clearance_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id TEXT NOT NULL REFERENCES trips(id),
      process_type TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'current', 'completed')),
      completed_at TEXT,
      UNIQUE(trip_id, step_order)
    );

    CREATE TABLE IF NOT EXISTS kanyaka_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id TEXT NOT NULL UNIQUE REFERENCES trips(id),
      direction TEXT NOT NULL,
      gov_list_uploaded INTEGER NOT NULL DEFAULT 0,
      gov_list_file TEXT,
      gov_list_uploaded_at TEXT,
      exception_reason TEXT,
      exception_approved INTEGER NOT NULL DEFAULT 0,
      exception_approved_at TEXT,
      exception_approved_by TEXT,
      transit_started_at TEXT,
      transit_completed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS pod_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id TEXT NOT NULL UNIQUE REFERENCES trips(id),
      turnaround_id TEXT REFERENCES turnarounds(id),
      collected INTEGER NOT NULL DEFAULT 0,
      collected_on_time INTEGER DEFAULT 0,
      collected_date TEXT,
      hours_to_collect INTEGER,
      scanned INTEGER NOT NULL DEFAULT 0,
      scanned_date TEXT,
      scanned_by TEXT,
      uploaded INTEGER NOT NULL DEFAULT 0,
      uploaded_date TEXT,
      sent_to_invoicing INTEGER NOT NULL DEFAULT 0,
      sent_date TEXT,
      kpi TEXT DEFAULT 'green'
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      username TEXT,
      action TEXT NOT NULL,
      target_id TEXT,
      target_type TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      ip_address TEXT,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id TEXT REFERENCES trips(id),
      upload_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT DEFAULT '',
      uploaded_by TEXT,
      uploaded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT NOT NULL DEFAULT '[]',
      system INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT,
      password_hash TEXT NOT NULL,
      role_id TEXT NOT NULL REFERENCES roles(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'banned')),
      area TEXT,
      assigned_areas TEXT NOT NULL DEFAULT '[]',
      module_permissions TEXT NOT NULL DEFAULT '{}',
      phone TEXT,
      banned_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS area_status_lists (
      id TEXT PRIMARY KEY,
      area TEXT NOT NULL UNIQUE,
      statuses TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_area_assignments (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      assigned_areas TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trip_area_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_number TEXT NOT NULL,
      area TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_by TEXT,
      notes TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS driver_contacts (
      id TEXT PRIMARY KEY,
      trip_number TEXT,
      driver_name TEXT NOT NULL,
      truck TEXT,
      direction TEXT DEFAULT 'NB' CHECK(direction IN ('NB', 'SB')),
      border TEXT,
      owner TEXT,
      drc_number TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      registered_by TEXT,
      registered_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_trips_direction ON trips(direction);
    CREATE INDEX IF NOT EXISTS idx_trips_turnaround ON trips(turnaround_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_trip ON workflow_steps(trip_id);
    CREATE INDEX IF NOT EXISTS idx_border_trip ON border_clearance_steps(trip_id);
    CREATE INDEX IF NOT EXISTS idx_driver_contacts_trip ON driver_contacts(trip_number);
    CREATE INDEX IF NOT EXISTS idx_driver_contacts_name ON driver_contacts(driver_name);

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      whatsapp TEXT,
      address TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fleet_drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      drc_number TEXT,
      whatsapp TEXT,
      license_number TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fleet_units (
      id TEXT PRIMARY KEY,
      truck_plate TEXT NOT NULL UNIQUE,
      trailer_plate TEXT,
      horse_plate TEXT,
      vehicle_type TEXT DEFAULT 'Truck',
      driver_id TEXT REFERENCES fleet_drivers(id),
      gps_device_id TEXT,
      gps_lat REAL,
      gps_lng REAL,
      gps_label TEXT,
      gps_updated_at TEXT,
      owner_id TEXT REFERENCES fleet_owners(id),
      status TEXT DEFAULT 'available',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS client_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL REFERENCES clients(id),
      origin TEXT,
      destination TEXT,
      loading_point TEXT,
      offloading_point TEXT,
      commodity TEXT,
      cargo_type TEXT,
      customer_ref TEXT,
      required_date TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'draft',
      kpi TEXT DEFAULT 'green',
      notes TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_allocations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES client_orders(id),
      fleet_unit_id TEXT NOT NULL REFERENCES fleet_units(id),
      scheduled_date TEXT,
      status TEXT DEFAULT 'scheduled',
      allocated_by TEXT,
      allocated_at TEXT DEFAULT (datetime('now')),
      notes TEXT,
      UNIQUE(order_id, fleet_unit_id)
    );

    CREATE INDEX IF NOT EXISTS idx_client_orders_client ON client_orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_client_orders_status ON client_orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_alloc_order ON order_allocations(order_id);
    CREATE INDEX IF NOT EXISTS idx_fleet_units_driver ON fleet_units(driver_id);
    CREATE INDEX IF NOT EXISTS idx_fleet_units_status ON fleet_units(status);
  `);
  migrateClientOrdersSchema();
  migrateRouteCatalogSchema();
}

function migrateRouteCatalogSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS route_countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country_code TEXT NOT NULL REFERENCES route_countries(code),
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS route_loading_points (
      id TEXT PRIMARY KEY,
      station_id TEXT NOT NULL REFERENCES route_stations(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_offloading_points (
      id TEXT PRIMARY KEY,
      station_id TEXT NOT NULL REFERENCES route_stations(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      origin_station_id TEXT NOT NULL REFERENCES route_stations(id),
      destination_station_id TEXT NOT NULL REFERENCES route_stations(id),
      origin_country TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      route_type TEXT NOT NULL DEFAULT 'domestic',
      entry_border TEXT,
      via_border_1 TEXT,
      via_border_2 TEXT,
      port_of_entry TEXT,
      exit_border TEXT,
      default_loading_point TEXT,
      default_offloading_point TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS fleet_trips (
      id TEXT PRIMARY KEY,
      trip_reference TEXT NOT NULL,
      scheduled_loading_date TEXT,
      scheduled_time TEXT DEFAULT '07:00',
      transporter TEXT,
      fleet_unit_id TEXT REFERENCES fleet_units(id),
      truck_plate TEXT,
      trailer_plate TEXT,
      second_trailer_plate TEXT,
      driver_id TEXT REFERENCES fleet_drivers(id),
      co_driver TEXT,
      current_truck_position TEXT,
      bivac_no TEXT,
      client_invoice_no TEXT,
      po_client_order_no TEXT,
      status TEXT DEFAULT 'draft',
      notes TEXT,
      trip_orders_json TEXT DEFAULT '[]',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_route_stations_country ON route_stations(country_code);
    CREATE INDEX IF NOT EXISTS idx_route_templates_origin ON route_templates(origin_station_id);
    CREATE INDEX IF NOT EXISTS idx_route_templates_dest ON route_templates(destination_station_id);
    CREATE INDEX IF NOT EXISTS idx_fleet_trips_status ON fleet_trips(status);

    CREATE TABLE IF NOT EXISTS fleet_trucks (
      id TEXT PRIMARY KEY,
      plate TEXT NOT NULL UNIQUE,
      make TEXT,
      model TEXT,
      capacity_mt REAL,
      status TEXT DEFAULT 'available',
      fleet_set_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fleet_trailers (
      id TEXT PRIMARY KEY,
      plate TEXT NOT NULL UNIQUE,
      trailer_type TEXT DEFAULT 'standard',
      capacity_mt REAL,
      side_height_mt REAL,
      status TEXT DEFAULT 'available',
      fleet_set_id TEXT,
      paired_trailer_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_fleet_trucks_set ON fleet_trucks(fleet_set_id);
    CREATE INDEX IF NOT EXISTS idx_fleet_trailers_set ON fleet_trailers(fleet_set_id);
  `);
  migrateFleetAssetSchema();
}

function migrateFleetAssetSchema() {
  const truckCols = db.prepare('PRAGMA table_info(fleet_trucks)').all().map(c => c.name);
  const trailerCols = db.prepare('PRAGMA table_info(fleet_trailers)').all().map(c => c.name);
  if (!truckCols.includes('details_json')) db.exec(`ALTER TABLE fleet_trucks ADD COLUMN details_json TEXT DEFAULT '{}'`);
  if (!truckCols.includes('owner')) db.exec(`ALTER TABLE fleet_trucks ADD COLUMN owner TEXT`);
  if (!truckCols.includes('fleet_no')) db.exec(`ALTER TABLE fleet_trucks ADD COLUMN fleet_no TEXT`);
  if (!trailerCols.includes('details_json')) db.exec(`ALTER TABLE fleet_trailers ADD COLUMN details_json TEXT DEFAULT '{}'`);
  if (!trailerCols.includes('owner')) db.exec(`ALTER TABLE fleet_trailers ADD COLUMN owner TEXT`);
  if (!trailerCols.includes('fleet_no')) db.exec(`ALTER TABLE fleet_trailers ADD COLUMN fleet_no TEXT`);
}

function migrateClientOrdersSchema() {
  const cols = db.prepare('PRAGMA table_info(client_orders)').all().map(c => c.name);
  const add = (name, def) => {
    if (!cols.includes(name)) db.exec(`ALTER TABLE client_orders ADD COLUMN ${name} ${def}`);
  };
  add('order_details_json', "TEXT DEFAULT '{}'");
  add('origin_country', 'TEXT');
  add('destination_country', 'TEXT');
  add('route_type', "TEXT DEFAULT 'domestic'");
  add('entry_border', 'TEXT');
  add('via_border_1', 'TEXT');
  add('via_border_2', 'TEXT');
  add('port_of_entry', 'TEXT');
  add('exit_border', 'TEXT');
  add('entry_border_agent', 'TEXT');
  add('via_border_1_agent', 'TEXT');
  add('via_border_2_agent', 'TEXT');
  add('port_entry_agent', 'TEXT');
  add('exit_border_agent', 'TEXT');
  add('order_date', 'TEXT');
  add('ready_to_load_on', 'TEXT');
  add('complete_loads_by', 'TEXT');
  add('shipper', 'TEXT');
  add('consignee', 'TEXT');
  add('invoice_party', 'TEXT');
  add('imp_exp', 'TEXT');
  migrateFleetUnitsSchema();
  migrateHelpdeskSchema();
}

function migrateHelpdeskSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS helpdesk_tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT NOT NULL UNIQUE,
      subject TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Other',
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'open',
      module_page TEXT,
      browser_info TEXT,
      reporter_user_id TEXT,
      reporter_username TEXT,
      assignee_user_id TEXT,
      assignee_username TEXT,
      area TEXT,
      related_type TEXT,
      related_ref TEXT,
      target_resolve_at TEXT,
      first_response_at TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS helpdesk_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      author_user_id TEXT,
      author_username TEXT,
      body TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status ON helpdesk_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_reporter ON helpdesk_tickets(reporter_user_id);
    CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_target ON helpdesk_tickets(target_resolve_at);

    CREATE TABLE IF NOT EXISTS internal_emails (
      id TEXT PRIMARY KEY,
      from_email TEXT NOT NULL,
      from_name TEXT,
      to_emails TEXT,
      to_names TEXT,
      cc_emails TEXT,
      bcc_emails TEXT,
      for_user_email TEXT NOT NULL,
      owner_email TEXT,
      folder TEXT NOT NULL DEFAULT 'inbox',
      subject TEXT,
      body TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      read_flag INTEGER DEFAULT 0,
      starred INTEGER DEFAULT 0,
      important INTEGER DEFAULT 0,
      attachments TEXT,
      related_type TEXT,
      related_ref TEXT,
      related_label TEXT,
      thread_id TEXT,
      mirror_of TEXT
    );

    CREATE TABLE IF NOT EXISTS internal_chat_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'direct',
      member_emails TEXT NOT NULL,
      member_names TEXT,
      avatar TEXT,
      last_message TEXT,
      last_at TEXT DEFAULT (datetime('now')),
      pinned INTEGER DEFAULT 0,
      muted INTEGER DEFAULT 0,
      related_type TEXT,
      related_ref TEXT,
      created_by_email TEXT,
      created_by_name TEXT
    );

    CREATE TABLE IF NOT EXISTS internal_chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      sender_name TEXT,
      message TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'delivered',
      reply_to TEXT,
      attachment_name TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_internal_emails_for_user ON internal_emails(for_user_email);
    CREATE INDEX IF NOT EXISTS idx_internal_chat_messages_room ON internal_chat_messages(room_id);
  `);
  const cols = db.prepare('PRAGMA table_info(helpdesk_tickets)').all().map(c => c.name);
  if (!cols.includes('target_first_response_at')) {
    db.exec('ALTER TABLE helpdesk_tickets ADD COLUMN target_first_response_at TEXT');
    db.prepare(`
      UPDATE helpdesk_tickets
      SET target_first_response_at = datetime(created_at, '+' || CASE priority
        WHEN 'urgent' THEN '1 hours'
        WHEN 'high' THEN '2 hours'
        WHEN 'low' THEN '8 hours'
        ELSE '4 hours'
      END)
      WHERE target_first_response_at IS NULL
    `).run();
  }
}

function migrateFleetUnitsSchema() {
  const cols = db.prepare('PRAGMA table_info(fleet_units)').all().map(c => c.name);
  const add = (name, def) => {
    if (!cols.includes(name)) db.exec(`ALTER TABLE fleet_units ADD COLUMN ${name} ${def}`);
  };
  add('truck_id', 'TEXT');
  add('trailer_id', 'TEXT');
  add('second_trailer_id', 'TEXT');
}

initSchema();

module.exports = db;
