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
  `);
}

initSchema();

module.exports = db;
