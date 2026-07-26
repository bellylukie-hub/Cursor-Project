/**
 * Seed database from demo trip data.
 * Run: npm run seed
 */
const db = require('./db/database');
const { seedUsers } = require('./seedUsers');
const { createNbTrip, createSbTripFromTurnaround } = require('./services/turnaroundService');
const { completeBorderSubStep, completeWorkflowStep, advancePodStage, uploadGovList } = require('./services/workflowEngine');

const demoNbTrips = [
  { tripNumber: 'NB-2024-001', truck: 'ABC123DRC', driver: 'John Doe', owner: 'Transport Co A', area: 'Kasumbalesa', entryBorder: 'Kasumbalesa', offloadingPoint: 'Kolwezi Mine', borderProcess: 'KBP' },
  { tripNumber: 'NB-2024-031', truck: 'MNO012DRC', driver: 'David Mukendi', owner: 'Transport Co A', area: 'Kanyaka', entryBorder: 'Kasumbalesa', offloadingPoint: 'Kanyaka Depot', borderProcess: 'KBP' },
  { tripNumber: 'NB-2024-045', truck: 'ABC789DRC', driver: 'Henry Sampa', owner: 'Transport Co C', area: 'Kanyaka', entryBorder: 'Kasumbalesa', offloadingPoint: 'Kanyaka Depot', borderProcess: 'KBP' }
];

function clearData() {
  const tables = ['uploads', 'audit_logs', 'pod_records', 'kanyaka_records', 'border_clearance_steps', 'workflow_steps', 'trips', 'turnarounds', 'trucks', 'fleet_owners'];
  tables.forEach(t => db.prepare(`DELETE FROM ${t}`).run());
}

function advanceNbToKanyaka(tripNumber) {
  const borderCount = db.prepare(`
    SELECT COUNT(*) as c FROM border_clearance_steps b
    JOIN trips t ON t.id = b.trip_id WHERE t.trip_number = ?
  `).get(tripNumber).c;

  for (let i = 1; i <= borderCount; i++) {
    try { completeBorderSubStep(tripNumber, i); } catch (_) { /* already done */ }
  }
  try { completeWorkflowStep(tripNumber, 'kanyaka'); } catch (_) {}
}

function seed() {
  clearData();
  console.log('Seeding database...');

  demoNbTrips.forEach(t => {
    try {
      createNbTrip(t);
      console.log(`  Created ${t.tripNumber}`);
    } catch (e) {
      console.log(`  Skip ${t.tripNumber}: ${e.message}`);
    }
  });

  // Advance NB-2024-031 through border to Kanyaka (in transit)
  advanceNbToKanyaka('NB-2024-031');

  // Advance NB-2024-045 through full NB cycle for SB demo
  advanceNbToKanyaka('NB-2024-045');
  try {
    completeWorkflowStep('NB-2024-045', 'offloading');
    advancePodStage('NB-2024-045', 'collected');
    advancePodStage('NB-2024-045', 'scanned');
    advancePodStage('NB-2024-045', 'uploaded');
    advancePodStage('NB-2024-045', 'sent_to_invoicing');
    console.log('  NB-2024-045 POD complete — ready for SB');
  } catch (e) {
    console.log(`  NB-2024-045 POD: ${e.message}`);
  }

  try {
    const sb = createSbTripFromTurnaround('NB-2024-045', {
      tripNumber: 'SB-2024-045',
      loadingPoint: 'Kanyaka Mine',
      exitBorder: 'Kasumbalesa'
    });
    console.log(`  Created linked SB: ${sb.tripNumber}`);
    completeWorkflowStep('SB-2024-045', 'loading');
    completeWorkflowStep('SB-2024-045', 'documents');
    completeWorkflowStep('SB-2024-045', 'seal');
    completeWorkflowStep('SB-2024-045', 'escort');
    completeWorkflowStep('SB-2024-045', 'dispatch');
    uploadGovList('SB-2024-045', 'kanyaka-gov-list-july.csv');
    console.log('  SB-2024-045 at Kanyaka with Gov List uploaded');
  } catch (e) {
    console.log(`  SB link: ${e.message}`);
  }

  // Fleet: Transport Co D allows different truck for SB
  const fo = db.prepare(`SELECT id FROM fleet_owners WHERE name = 'Transport Co D'`).get();
  if (!fo) {
    db.prepare(`INSERT INTO fleet_owners (id, name, require_same_truck_sb) VALUES ('FO-TCO-D', 'Transport Co D', 0)`).run();
    console.log('  Fleet Transport Co D: same-truck SB requirement OFF');
  }

  console.log('Seed complete.');
  seedUsers();
}

seed();
