# Botless Contributor Policy

Created by Denis Yermakou, Founder & CEO of AxonOS.

Boundary Run v64 keeps the public contributor graph human-attributed.

## Rules

1. GitHub Actions must not commit to `main`.
2. GitHub Actions must not publish `gh-pages` with `github-actions[bot]`.
3. Pages deployment is performed locally with `scripts/deploy_pages_branch.sh`.
4. Dependabot may open pull requests, but changes should be reviewed and re-committed manually by Denis Yermakou when strict contributor hygiene is required.
5. Release tags must be immutable. No force-updating release tags.
6. CI workflows use `contents: read` only.

## Verification

```bash
bash scripts/check_no_bot_authors.sh
```
