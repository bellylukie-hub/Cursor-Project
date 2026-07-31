#!/bin/sh
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env — edit JWT_SECRET before production."
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node.js 20+ first."
  exit 1
fi

echo "Installing backend dependencies..."
cd backend
npm install

if [ "${RUN_SEED:-}" = "true" ] || grep -q '^RUN_SEED=true' ../.env 2>/dev/null; then
  echo "Seeding demo data..."
  npm run seed
else
  echo "Ensuring users exist..."
  node -e "require('./src/seedUsers').seedUsers()"
fi

cd ..
echo ""
echo "Installation complete."
echo "Start with:  cd backend && npm start"
echo "Or PM2:      pm2 start ecosystem.config.cjs"
echo "Open:        http://localhost:3001"
