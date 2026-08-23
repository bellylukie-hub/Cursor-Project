#!/bin/sh
# Mobile package (Capacitor + PWA manifest)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-v2.5.16-mobile}"
OUT_DIR="$ROOT/dist"
FOLDER="TruckControl-Mobile-${VERSION}"
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
  index.html app.js api.js offline-sync.js i18n.js internal-communication.js manifest.webmanifest favicon.svg images \
  live-operations.js admin-persistence.js control-room-ui.js fleet-orders.js fleet-vehicle-spec.js \
  route-catalog.js trip-scheduler.js freight-admin-settings.js helpdesk.js fleet-map.js workshop.js fuel-control.js \
  custom-reports.js themes.js process-guide.js help-assistant.js report-export.js \
  soft-delete.js bulk-actions.js database-tools.js mobile backend \
  README.md docs

rm -rf "$STAGE/backend/node_modules" "$STAGE/backend/data" "$STAGE/backend/uploads" "$STAGE/dist" 2>/dev/null || true

cd "$OUT_DIR"
zip -rq "$ZIP_NAME" "$FOLDER"
echo "Created: $OUT_DIR/$ZIP_NAME"
echo "PWA: open index.html via HTTPS server or install from browser"
echo "Native: cd $FOLDER/mobile && npm install && npx cap add android && npm run sync"
