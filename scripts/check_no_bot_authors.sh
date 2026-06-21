#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "SKIP: not a git repository"
  exit 0
fi
BAD="$(git log --format='%an <%ae>' --all | grep -Ei 'github-actions\[bot\]|dependabot\[bot\]|noreply@github.com' || true)"
if [ -n "$BAD" ]; then
  echo "FAIL: bot-authored commits detected:"
  echo "$BAD"
  exit 1
fi
echo "OK: no bot-authored commits detected"
