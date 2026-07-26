#!/bin/sh
set -e
cd "$(dirname "$0")"

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "RUN_SEED=true — loading demo trips and users..."
  node src/seed.js
else
  echo "Ensuring roles and users exist (idempotent)..."
  node -e "require('./src/seedUsers').seedUsers()"
fi

exec node src/index.js
