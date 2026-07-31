#!/bin/sh
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "Created .env from .env.example"
  echo "IMPORTANT: Edit .env and set JWT_SECRET before production use."
  echo ""
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker first:"
  echo "  https://docs.docker.com/engine/install/"
  exit 1
fi

echo "Building and starting TruckControl..."
docker compose up -d --build

echo ""
echo "TruckControl is starting on port ${PORT:-3001}"
echo "Open: http://localhost:${PORT:-3001}"
echo "Login: super_admin / ChangeMe123!"
echo ""
echo "View logs: docker compose logs -f"
echo "Stop:      docker compose down"
