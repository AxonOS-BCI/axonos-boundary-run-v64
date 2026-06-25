# Changelog

## v64.1.0 — Verified Proof & Premium Pass — 2026-06-26

### Added

- Golden replay vectors (`qa/proofs/golden-{1,2,3}.json`) covering short, long, and minimal runs.
- CI now verifies the deterministic replay proof on every push, cross-checked in **both** Python (`tools/boundary_run_verify_v3.py`) and JavaScript (`qa/replay_core_vectors.mjs`).
- Top-level `LICENSE` (full AGPL-3.0 text) for automatic license detection.
- On-canvas hazard telegraph, dash afterimage trail, and hit-punch feedback.

### Changed

- Replay verifier is now strict: it validates schema, seed range and input-mask range; **rejects** (does not silently normalise) out-of-range input; enforces a tick ceiling; and FAILS on any hash or outcome mismatch — including `bestCombo`, which is now re-simulated and bound.
- Premium visual/UX pass: a restrained, coherent palette; a clean on-canvas HUD; a game-first page layout; quieter status messages.
- CI gate runner (`pro_ci_gate.py`) now documents the real depth of each check and runs the proof gate.
- Static-audit hardening checks use explicit raises (not bare `assert`, so they survive `python -O`); the telemetry scanner was broadened (`EventSource`, `importScripts`).
- `URL.revokeObjectURL` is deferred so the proof download is not cancelled on slower devices.

### Notes

- The deterministic simulation core is unchanged **byte-for-byte**, so every replay proof exported by v64.0.0 still verifies.

## v64.0.0 — Foundation Standard — 2026-06-21

### Added

- README direct launch link for the playable GitHub Pages build.
- Repository-wide attribution metadata for Denis Yermakou.
- Attribution verification script and CI check.

- Initial public Foundation Standard release for AxonOS Boundary Run v64.
- Static playable browser game implementation.
- Ari safe-intent courier gameplay loop.
- Kibo guardian co-authorisation warning model.
- Consent FSM representation: `Granted`, `Suspended`, `Withdrawn`.
- Integrity-based failure model.
- Neural Boundary Field zone system.
- Neural Weather model.
- Local replay proof export.
- Colorblind mode toggle.
- Screen-reader live region for warnings.
- Full v64 technical specification under `docs/`.
- Traceability matrix mapping game mechanics to AxonOS architecture concepts.
- Security, governance, contributing, trademark, third-party notices, and donation documents.
- Zero-telemetry audit tooling.
- No-Service-Worker verification.
- Donation-address integrity verification.
- Reproducibility tree-hash check.
- Release packaging script and SHA-256 asset manifest generation.
- GitHub Release automation script.
- CI workflow.
- Tag-triggered release workflow.
- GitHub Pages deployment workflow.

### Security

- Runtime forbids `fetch()`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, and Service Worker registration.
- Runtime is self-contained and does not depend on external CDN assets.
- Donation address moved to `DONATIONS.md` and verified by script.

### Known limitations

- Current runtime is static JavaScript/Canvas Foundation implementation.
- Final Rust/WASM deterministic simulation core remains a roadmap target.
- Formal Kani/fuzz/WCRT proof chain is not claimed complete in this Foundation release.


## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.
