#!/bin/sh
# Verify all frontend modules referenced in index.html exist in the package root.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MISSING=0
for script in $(grep -oP '(?<=src=")[^"]+\.js' index.html | grep -v '^https'); do
  if [ ! -f "$script" ]; then
    echo "MISSING: $script"
    MISSING=1
  fi
done

REQUIRED="favicon.svg bulk-actions.js soft-delete.js database-tools.js internal-communication.js"
for f in $REQUIRED; do
  if [ ! -f "$f" ]; then
    echo "MISSING required file: $f"
    MISSING=1
  fi
done

if [ ! -f backend/src/services/databaseExplorerService.js ]; then
  echo "MISSING backend: backend/src/services/databaseExplorerService.js"
  MISSING=1
fi

if [ ! -f backend/src/services/internalCommService.js ]; then
  echo "MISSING backend: backend/src/services/internalCommService.js"
  MISSING=1
fi

for f in docs/COMPLETE-MANUAL.md docs/USER-GUIDE.md docs/INSTALLATION.md docs/images/internal-comm-email.svg docs/images/internal-comm-chat.svg; do
  if [ ! -f "$f" ]; then
    echo "MISSING documentation: $f"
    MISSING=1
  fi
done

if [ "$MISSING" -eq 1 ]; then
  echo "Production package verification FAILED"
  exit 1
fi

echo "Production package verification OK — all $(grep -c 'src=.*\.js' index.html) scripts present"
