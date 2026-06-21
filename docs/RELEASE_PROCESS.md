# Release Process: AxonOS Boundary Run v64

This repository uses a hardened release discipline:

1. Verify the working tree.
2. Run static security checks (smoke, audit, no-sw, donations, attribution, reproducibility).
3. Build the static distribution.
4. Package source and distribution assets.
5. Generate SHA-256 checksums.
6. Push `main`.
7. Create a signed release tag (NO force — tag must not exist).
8. Publish a GitHub Release with assets.
9. Confirm GitHub Pages deployment.

## Safety rules

- **NEVER** use `git tag -f` or `git push -f` for release tags.
- **NEVER** auto-install tools in release scripts.
- **ALWAYS** verify tag does not exist locally or remotely before creating.
- **ALWAYS** run all verification scripts before packaging.

## Local verification

```bash
node qa/boundary-run-static-smoke-v64.mjs
python3 tools/boundary_run_audit_v64.py
bash scripts/verify_no_sw.sh
bash scripts/verify_donation_address.sh
bash scripts/verify_attribution.sh
bash scripts/reproducibility_check.sh
bash scripts/build_web.sh dist
bash scripts/package_release.sh
```

## GitHub Release

```bash
bash scripts/create_github_release_v64.sh
```

The script uses GitHub CLI (`gh`). Install it from https://cli.github.com/ first.

Then authenticate:

```bash
gh auth login
```

## Tag

Current release tag:

```text
v64.0.0
```

## GitHub Pages

The Pages workflow builds `dist/` and deploys it as a static site. In repository settings, GitHub Pages should be configured to use GitHub Actions.

## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.

## Botless Pages Deployment

Run `bash scripts/deploy_pages_branch.sh` locally from `main`. Do not use `actions/deploy-pages`; it creates bot-managed deployments and is not used in v64.
