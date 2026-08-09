#!/bin/sh
set -e
cd "$(dirname "$0")"

# Only load demo trips when the database is empty — never wipe production data on restart.
if [ "${RUN_SEED:-false}" = "true" ]; then
  node -e "
    const db = require('./src/db/database');
    const tripCount = db.prepare('SELECT COUNT(*) AS c FROM trips').get().c;
    if (tripCount === 0) {
      console.log('Empty database — loading demo trips and users (RUN_SEED=true)...');
      require('child_process').execSync('node src/seed.js', { stdio: 'inherit' });
    } else {
      console.log('Database already has ' + tripCount + ' trip(s) — keeping production data (skipping demo seed).');
      require('./src/seedUsers').seedUsers();
      try {
        const { seedFleetOrderData } = require('./src/services/fleetOrderService');
        seedFleetOrderData();
      } catch (_) {}
    }
  "
else
  echo "RUN_SEED=false — ensuring roles and users exist (production mode)..."
  node -e "require('./src/seedUsers').seedUsers()"
fi

exec node src/index.js
