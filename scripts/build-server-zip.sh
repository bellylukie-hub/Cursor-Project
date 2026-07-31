#!/bin/sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-v1.1.1-server}"
OUT_DIR="$ROOT/dist"
ZIP_NAME="TruckControl-Server-${VERSION}.zip"
STAGE="$OUT_DIR/TruckControl-Server-${VERSION}"

rm -rf "$STAGE" "$OUT_DIR/$ZIP_NAME"
mkdir -p "$STAGE"

cd "$ROOT"
zip -rq "$OUT_DIR/$ZIP_NAME" . \
  -x '.git/*' \
  -x 'backend/node_modules/*' \
  -x 'backend/data/*' \
  -x 'backend/uploads/*' \
  -x 'dist/*' \
  -x 'node_modules/*' \
  -x '.env'

echo "Created: $OUT_DIR/$ZIP_NAME"
ls -lh "$OUT_DIR/$ZIP_NAME"
