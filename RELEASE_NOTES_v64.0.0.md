# AxonOS Boundary Run v64.0.0 — Foundation Standard Edition

**Codename:** The Sovereign Signal
**Release date:** 2026-06-21
**Repository:** `AxonOS-BCI/axonos-boundary-run-v64`
**Release class:** Public educational game / cognitive privacy simulator
**License:** `AGPL-3.0-only OR AxonOS Commercial License`
**Creator / Founder / Maintainer:** Denis Yermakou

> Protect the choice. Protect the person.

## Executive release summary

Boundary Run v64.0.0 is the hardened Foundation Standard release of the AxonOS Boundary Run line. It addresses all critical security and release-engineering issues identified in the v52 audit, adds mobile touch controls, CSP protection, error handling, and improves governance documentation while maintaining the zero-telemetry, deterministic-replay architecture.

## What this release contains

### Playable Foundation build

- README direct launch link to GitHub Pages: https://axonos-bci.github.io/axonos-boundary-run-v64/
- Project attribution metadata normalized to Denis Yermakou across all files.
- Static HTML5 Canvas game loop with mobile touch controls.
- CSP meta tag with `frame-ancestors 'none'` for clickjacking protection.
- Error handling for `crypto.subtle.digest` failures.
- Sanitized proof export filenames (hex-only).
- NaN/state corruption detection in game loop.
- Screen-reader live regions and ARIA labels.
- Colorblind mode toggle.
- Screen shake on collision.
- Particle effects on hits and vault collection.
- Glow effect on hazard hits.
- Combo counter for consecutive vaults.
- Full player sprite with shadow and guardian halo.
- Weather-tinted backgrounds.
- Hazard labels for clarity.
- All 5 hazard types spawn correctly.

### Security and privacy posture

- Zero backend.
- Zero telemetry.
- No analytics.
- No external CDN runtime dependency.
- No `fetch()`.
- No `XMLHttpRequest`.
- No `WebSocket`.
- No `navigator.sendBeacon`.
- No Service Worker.
- CSP enforced.
- Local-only proof export with sanitized filenames.
- Donation-address integrity verification.

### Release engineering

- `scripts/build_web.sh` — builds the static distribution into `dist/`.
- `scripts/reproducibility_check.sh` — checks deterministic output tree hashing.
- `scripts/verify_no_sw.sh` — blocks service-worker introduction.
- `scripts/verify_donation_address.sh` — checks DOGE donation-address integrity.
- `scripts/verify_attribution.sh` — verifies attribution in 7 essential files.
- `scripts/package_release.sh` — builds release assets and checksums.
- `scripts/create_github_release_v64.sh` — SAFE release creation (no force tags, no auto-install).
- `.github/workflows/ci.yml` — CI verification for every push/PR.
- `.github/workflows/release.yml` — tag-triggered release packaging workflow.
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow.

### Documentation and governance

- `README.md` — public project front door with Foundation vs Target table.
- `docs/AxonOS_Boundary_Run_v64_Technical_Specification.md` — full v64 specification.
- `docs/TRACEABILITY_MATRIX.md` — game mechanics mapped to AxonOS concepts.
- `docs/RELEASE_PROCESS.md` — operator release procedure.
- `SECURITY.md` — coordinated disclosure policy with CSP documentation.
- `CONTRIBUTING.md` — contribution discipline and cognitive-data safety rule.
- `GOVERNANCE.md` — expanded project governance baseline.
- `CODE_OF_CONDUCT.md` — expanded professional conduct policy.
- `TRADEMARK.md` — AxonOS trademark scope.
- `THIRD_PARTY_NOTICES.md` — dependency/notice baseline.
- `DONATIONS.md` — donation address stored outside the README.
- `CHANGELOG.md` — version history with security fixes documented.

## Verification commands

```bash
node qa/boundary-run-static-smoke-v64.mjs
python3 tools/boundary_run_audit_v64.py
bash scripts/verify_no_sw.sh
bash scripts/verify_donation_address.sh
bash scripts/reproducibility_check.sh
bash scripts/package_release.sh
```

## Release assets

The release packaging script generates:

- `release-assets/axonos-boundary-run-v64.0.0-dist.zip`
- `release-assets/axonos-boundary-run-v64.0.0-source.zip`
- `release-assets/axonos-boundary-run-v64.0.0-source.tar.gz`
- `release-assets/SHA256SUMS.txt`
- `release-assets/RELEASE_NOTES_v64.0.0.md`

## Technical status

| Area | v64.0.0 status |
| --- | --- |
| Static browser playability | ✅ Complete Foundation build |
| Zero-telemetry audit | ✅ Implemented |
| No-Service-Worker posture | ✅ Implemented |
| Donation-address integrity check | ✅ Implemented |
| Replay proof export | ✅ Implemented with sanitization |
| CSP / clickjacking protection | ✅ Implemented |
| Mobile touch controls | ✅ Implemented |
| Error handling (crypto.subtle) | ✅ Implemented |
| CI smoke/audit/build | ✅ Implemented |
| GitHub Release automation | ✅ Safe (no force) |
| GitHub Pages deployment workflow | ✅ Implemented |
| Rust/WASM deterministic core | 🚧 Roadmap target |
| Kani/fuzz/WCRT proof chain | 🚧 Roadmap target |

## Known limitations

- The current playable layer is JavaScript/Canvas, not yet the final Rust/WASM simulation core.
- Replay verification is structural in this release; byte-exact deterministic replay is the next proof-system milestone.
- The full formal verification stack is not included in v64.0.0 Foundation.
- The security checks are static and conservative; they do not replace a full third-party audit.

## Operator note

This is the hardened release to publish to the `AxonOS-BCI/axonos-boundary-run-v64` repository. Use tag:

```bash
v64.0.0
```

Recommended GitHub Release title:

```text
AxonOS Boundary Run v64.0.0 — The Sovereign Signal
```

## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.