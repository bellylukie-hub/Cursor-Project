const path = require('path');
const db = require('../db/database');
const adminService = require('./adminService');
const env = require('../config/env');

const MAX_ROWS = 500;
const MAX_PAGE_SIZE = 200;

const FORBIDDEN_SQL = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|REPLACE|TRUNCATE|VACUUM|REINDEX)\b/i;

function assertSuperAdmin(user) {
  const perms = user?.permissions || [];
  if (perms.includes('*')) return;
  throw new Error('Super Admin access required for database tools');
}

function assertValidTableName(name) {
  if (!name || !/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error('Invalid table name');
  }
}

function quoteIdent(name) {
  assertValidTableName(name);
  return `"${name}"`;
}

function stripSqlComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .trim();
}

function validateReadOnlyQuery(sql) {
  const cleaned = stripSqlComments(sql);
  if (!cleaned) throw new Error('Query is empty');
  const withoutTrailing = cleaned.replace(/;+\s*$/g, '').trim();
  if (withoutTrailing.includes(';')) {
    throw new Error('Only one SQL statement is allowed');
  }
  const upper = withoutTrailing.toUpperCase();
  const allowed = upper.startsWith('SELECT') || upper.startsWith('WITH') || upper.startsWith('PRAGMA');
  if (!allowed) throw new Error('Only SELECT / WITH / read-only PRAGMA queries are allowed');
  if (FORBIDDEN_SQL.test(withoutTrailing)) {
    throw new Error('Write or DDL statements are not allowed');
  }
  return withoutTrailing;
}

function ensureRowLimit(sql, maxRows = MAX_ROWS) {
  if (/\bLIMIT\b/i.test(sql)) return sql;
  return `${sql} LIMIT ${maxRows}`;
}

function listTables() {
  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  return tables.map(t => {
    let rowCount = 0;
    try {
      rowCount = db.prepare(`SELECT COUNT(*) AS c FROM ${quoteIdent(t.name)}`).get().c;
    } catch (_) { /* ignore */ }
    return { name: t.name, rowCount };
  });
}

function getTableSchema(tableName) {
  assertValidTableName(tableName);
  const columns = db.prepare(`PRAGMA table_info(${quoteIdent(tableName)})`).all();
  const indexes = db.prepare(`PRAGMA index_list(${quoteIdent(tableName)})`).all();
  return { table: tableName, columns, indexes };
}

function browseTable(tableName, { limit = 50, offset = 0 } = {}) {
  assertValidTableName(tableName);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), MAX_PAGE_SIZE);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM ${quoteIdent(tableName)}`).get().c;
  const rows = db.prepare(`SELECT * FROM ${quoteIdent(tableName)} LIMIT ? OFFSET ?`).all(safeLimit, safeOffset);
  const columns = rows.length
    ? Object.keys(rows[0])
    : getTableSchema(tableName).columns.map(c => c.name);
  return { table: tableName, columns, rows, total, limit: safeLimit, offset: safeOffset };
}

function runSelectQuery(sql, user, { maxRows = MAX_ROWS } = {}) {
  assertSuperAdmin(user);
  const validated = validateReadOnlyQuery(sql);
  const limited = ensureRowLimit(validated, maxRows);
  const started = Date.now();
  const stmt = db.prepare(limited);
  const rows = stmt.all();
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const durationMs = Date.now() - started;

  adminService.logAuditEntry(
    'SQL query executed',
    'database',
    'sql_query',
    `${limited.slice(0, 500)}${limited.length > 500 ? '…' : ''} · ${rows.length} row(s) · ${durationMs}ms`,
    user
  );

  return {
    sql: limited,
    columns,
    rows,
    rowCount: rows.length,
    durationMs,
    truncated: rows.length >= maxRows
  };
}

function getDatabaseInfo() {
  const dbPath = db.dbPath || path.join(env.dataDir, 'truckcontrol.db');
  return {
    name: path.basename(dbPath),
    path: dbPath,
    dataDir: env.dataDir,
    engine: 'SQLite'
  };
}

module.exports = {
  listTables,
  getTableSchema,
  browseTable,
  runSelectQuery,
  getDatabaseInfo,
  assertSuperAdmin,
  MAX_ROWS,
  MAX_PAGE_SIZE
};
