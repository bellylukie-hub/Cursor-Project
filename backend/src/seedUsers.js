/**
 * Seed production users and roles.
 */
const db = require('./db/database');
const { hashPassword } = require('./services/authService');

const ALL_PERMISSIONS = [
  'read_all', 'read_own', 'create', 'edit_all', 'edit_limited', 'delete', 'purge',
  'view_logs', 'manage_users', 'manage_roles', 'manage_settings', 'manage_area_statuses'
];

const ROLES = [
  { id: 'role-super-admin', name: 'Super Admin', description: 'Full system access', system: 1, permissions: ALL_PERMISSIONS },
  { id: 'role-manager', name: 'Manager', description: 'Operations manager', system: 1, permissions: ['read_all', 'create', 'edit_all', 'view_logs', 'manage_users', 'manage_settings'] },
  { id: 'role-moderator', name: 'Moderator', description: 'Area-limited editor', system: 1, permissions: ['read_all', 'edit_limited'] },
  { id: 'role-user', name: 'User', description: 'Standard user', system: 1, permissions: ['read_own'] }
];

const DEFAULT_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';

const USERS = [
  { id: 'ADM-001', username: 'super_admin', email: 'admin@truckcontrol.local', roleId: 'role-super-admin', area: 'HQ', assignedAreas: ['All Areas'], phone: '+260 900 000001' },
  { id: 'ADM-002', username: 'ops_manager', email: 'ops.manager@truckcontrol.local', roleId: 'role-manager', area: 'All Areas', assignedAreas: ['All Areas'], phone: '+260 900 000002' },
  { id: 'ADM-003', username: 'border_moderator', email: 'ruth.mwansa@truckcontrol.local', roleId: 'role-moderator', area: 'Kasumbalesa', assignedAreas: ['Kasumbalesa'], phone: '+260 966 222333' },
  { id: 'ADM-004', username: 'driver_user', email: 'john.doe@transport.com', roleId: 'role-user', area: 'Kolwezi', assignedAreas: ['Kolwezi'], phone: '+260 977 123456' },
  { id: 'ADM-006', username: 'kanyaka_dispatcher', email: 'david.m@truckcontrol.local', roleId: 'role-moderator', area: 'Kanyaka', assignedAreas: ['Kanyaka'], phone: '+260 977 555666' }
];

function seedUsers() {
  console.log('Seeding roles and users...');
  const passwordHash = hashPassword(DEFAULT_PASSWORD);

  ROLES.forEach(r => {
    db.prepare(`
      INSERT INTO roles (id, name, description, permissions, system)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, permissions = excluded.permissions
    `).run(r.id, r.name, r.description, JSON.stringify(r.permissions), r.system);
  });

  USERS.forEach(u => {
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role_id, status, area, assigned_areas, phone)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        email = excluded.email,
        password_hash = excluded.password_hash,
        role_id = excluded.role_id,
        area = excluded.area,
        assigned_areas = excluded.assigned_areas,
        phone = excluded.phone
    `).run(u.id, u.username, u.email, passwordHash, u.roleId, u.area, JSON.stringify(u.assignedAreas), u.phone);
    console.log(`  User: ${u.username} (${u.roleId})`);
  });

  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at) VALUES ('appName', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run('Truck Turnaround & Operations Control System');

  console.log(`  Default password for all seeded users: ${DEFAULT_PASSWORD}`);
  console.log('  ⚠️  Change passwords after first login in production.');

  const { seedDriverContacts } = require('./services/driverContactService');
  seedDriverContacts([
    { id: 'DC-001', tripNumber: 'NB-2024-001', driverName: 'John Doe', truck: 'ABC123DRC', direction: 'NB', border: 'Kasumbalesa', owner: 'Transport Co A', drcNumber: '+243 812 345678', whatsapp: '+260 977 123456', registeredBy: 'border_moderator', registeredAt: '2026-07-23 08:30:00', updatedAt: '2026-07-23 08:30:00', notes: 'KBP Step 7' },
    { id: 'DC-002', tripNumber: 'NB-2024-008', driverName: 'Peter Mwansa', truck: 'JKL012DRC', direction: 'NB', border: 'Kasumbalesa', owner: 'Transport Co D', drcNumber: '+243 999 234567', whatsapp: '+260 966 234567', registeredBy: 'border_moderator', registeredAt: '2026-07-24 10:15:00', updatedAt: '2026-07-24 10:15:00', notes: '' }
  ]);
}

module.exports = { seedUsers };
