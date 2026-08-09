#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

cd "$ROOT/backend"

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3001}"
export DATA_DIR="${DATA_DIR:-$ROOT/backend/data}"
export UPLOADS_DIR="${UPLOADS_DIR:-$ROOT/backend/uploads}"

if [ "${RUN_SEED:-false}" = "true" ]; then
  node -e "
    const db = require('./src/db/database');
    const tripCount = db.prepare('SELECT COUNT(*) AS c FROM trips').get().c;
    if (tripCount === 0) {
      console.log('Empty database — loading demo data...');
      require('child_process').execSync('node src/seed.js', { stdio: 'inherit' });
    } else {
      console.log('Database has trips — keeping production data.');
      require('./src/seedUsers').seedUsers();
    }
  "
else
  echo "RUN_SEED=false — ensuring roles/users only (production mode)..."
  npm run seed:users
fi

exec node src/index.js
