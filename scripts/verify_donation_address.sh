#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
EXPECTED="DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp"
FILES=(README.md DONATIONS.md index.html)
if [ -f dist/index.html ]; then FILES+=(dist/index.html); fi
for f in "${FILES[@]}"; do
  if ! grep -q "$EXPECTED" "$f"; then
    echo "DONATION ADDRESS MISSING FROM $f"
    exit 1
  fi
done
echo "OK: donation address verified in ${FILES[*]}"
