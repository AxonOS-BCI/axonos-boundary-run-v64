#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
REPO="AxonOS-BCI/axonos-boundary-run-v64"
PAGES_DIR="$HOME/axonos-boundary-run-v64-pages"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "FAIL: run from main branch, current branch is $CURRENT_BRANCH"
  exit 1
fi
bash scripts/build_web.sh dist
rm -rf "$PAGES_DIR"
mkdir -p "$PAGES_DIR"
cp -a dist/. "$PAGES_DIR/"
touch "$PAGES_DIR/.nojekyll"
GIT_NAME="$(git config user.name || true)"
GIT_EMAIL="$(git config user.email || true)"
: "${GIT_NAME:=Denis Yermakou}"
: "${GIT_EMAIL:=wiser1707@gmail.com}"
git branch -D gh-pages >/dev/null 2>&1 || true
git checkout --orphan gh-pages
git rm -rf . >/dev/null 2>&1 || true
cp -a "$PAGES_DIR"/. .
git add -A
git -c user.name="$GIT_NAME" -c user.email="$GIT_EMAIL" commit -m "deploy(pages): publish AxonOS Boundary Run v64 static build"
git push --force-with-lease origin gh-pages
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh api -X PUT "repos/${REPO}/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null   || gh api -X POST "repos/${REPO}/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null   || true
fi
git checkout main
rm -rf "$PAGES_DIR"
echo "DONE: gh-pages branch deployed. Check: https://axonos-bci.github.io/axonos-boundary-run-v64/"
