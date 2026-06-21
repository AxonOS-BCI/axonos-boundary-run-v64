#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "FAIL: deploy_pages_branch.sh must be run from main branch (current: $CURRENT_BRANCH)"
  exit 1
fi

bash scripts/build_web.sh dist

if [ ! -d "dist" ]; then
  echo "FAIL: dist/ not found. Run scripts/build_web.sh first."
  exit 1
fi

TMP_BRANCH="gh-pages-deploy-$(date +%s)"
git checkout -b "$TMP_BRANCH"
git add dist/
git commit -m "deploy: update GitHub Pages build" || { echo "No changes to commit"; git checkout main; git branch -D "$TMP_BRANCH"; exit 0; }

if git show-ref --verify --quiet refs/heads/gh-pages; then
  git checkout gh-pages
  git rm -rf . >/dev/null 2>&1 || true
  git checkout "$TMP_BRANCH" -- dist/
  mv dist/* .
  rm -rf dist
  git add .
  git commit -m "deploy: update GitHub Pages from main ($(date -u +%Y-%m-%d))"
else
  git checkout --orphan gh-pages
  git rm -rf . >/dev/null 2>&1 || true
  git checkout "$TMP_BRANCH" -- dist/
  mv dist/* .
  rm -rf dist
  git add .
  git commit -m "deploy: initial GitHub Pages build"
fi

git push origin gh-pages --force-with-lease
git checkout main
git branch -D "$TMP_BRANCH"

echo "DONE: GitHub Pages branch updated. Set Pages source to 'Deploy from a branch' -> 'gh-pages' in repository settings."