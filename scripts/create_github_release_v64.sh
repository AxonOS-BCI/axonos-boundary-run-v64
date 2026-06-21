#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
REPO="AxonOS-BCI/axonos-boundary-run-v64"
VERSION="$(cat VERSION | tr -d '[:space:]')"
TAG="v${VERSION}"
TITLE="AxonOS Boundary Run ${VERSION} — The Sovereign Signal"
NOTES="RELEASE_NOTES_v64.0.0.md"
if ! command -v gh >/dev/null 2>&1; then
  echo "FAIL: GitHub CLI 'gh' is required. Install it manually and run: gh auth login"
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "FAIL: GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERROR: Tag $TAG already exists locally. Aborting. Do not force-update release tags."
  exit 1
fi
if git ls-remote --tags origin "refs/tags/$TAG" | grep -q "$TAG"; then
  echo "ERROR: Tag $TAG already exists on remote. Aborting. Do not force-update release tags."
  exit 1
fi
bash scripts/package_release.sh
git add .
git commit -m "release: AxonOS Boundary Run ${TAG} Foundation Standard" || echo "No source changes to commit"
git push -u origin main
git tag -a "$TAG" -m "AxonOS Boundary Run ${TAG} — Foundation Standard"
git push origin "$TAG"
gh release create "$TAG" release-assets/* --repo "$REPO" --title "$TITLE" --notes-file "$NOTES" --latest
echo "DONE: GitHub Release published: ${TAG}"
