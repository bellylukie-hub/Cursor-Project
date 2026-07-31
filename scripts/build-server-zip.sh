#!/bin/sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-v1.1.1-server}"
OUT_DIR="$ROOT/dist"
FOLDER="TruckControl-Server-${VERSION}"
ZIP_NAME="${FOLDER}.zip"
STAGE="$OUT_DIR/$FOLDER"

rm -rf "$STAGE" "$OUT_DIR/$ZIP_NAME"
mkdir -p "$STAGE"

copy_item() {
  for item in "$@"; do
    [ -e "$ROOT/$item" ] && cp -a "$ROOT/$item" "$STAGE/"
  done
}

copy_item \
  index.html app.js api.js live-operations.js \
  Dockerfile docker-compose.yml .dockerignore .env.example \
  README.md PRODUCTION.md DEPLOY.md INSTALL-SERVER.md \
  ecosystem.config.cjs pm2-start.sh install-docker.sh install-linux.sh \
  samples scripts backend

chmod +x "$STAGE/install-docker.sh" "$STAGE/install-linux.sh" "$STAGE/pm2-start.sh" 2>/dev/null || true
chmod +x "$STAGE/backend/docker-entrypoint.sh" 2>/dev/null || true
rm -rf "$STAGE/backend/node_modules" "$STAGE/backend/data" "$STAGE/backend/uploads" "$STAGE/dist" 2>/dev/null || true

cd "$OUT_DIR"
zip -rq "$ZIP_NAME" "$FOLDER"
echo "Created: $OUT_DIR/$ZIP_NAME ($(du -h "$OUT_DIR/$ZIP_NAME" | cut -f1))"
echo "Extract: unzip $ZIP_NAME && cd $FOLDER"
