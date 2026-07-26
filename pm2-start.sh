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
  echo "RUN_SEED=true — loading demo trips and users..."
  node src/seed.js
else
  echo "RUN_SEED=false — ensuring roles/users only (no demo trip reload)..."
  npm run seed:users
fi

exec node src/index.js
