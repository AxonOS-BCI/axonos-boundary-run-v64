#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
REQUIRED="Denis Yermakou"
FILES=(
  README.md
  ATTRIBUTION.md
  LICENSE-AGPL
  index.html
  src/game.js
  src/manifest.json
  package.json
)
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then echo "FAIL: missing attribution target: $f"; exit 1; fi
  if ! grep -q "$REQUIRED" "$f"; then echo "FAIL: attribution missing in $f"; exit 1; fi
done
if ! grep -q "https://axonos-bci.github.io/axonos-boundary-run-v64/" README.md; then
  echo "FAIL: README launch link missing"; exit 1
fi
echo "OK: Denis Yermakou attribution verified"
