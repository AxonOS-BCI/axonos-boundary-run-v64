# AxonOS Boundary Run v64.1.0 — Verified Proof & Premium Pass

**Codename:** The Sovereign Signal  
**Release date:** 2026-06-26  
**Repository:** `AxonOS-BCI/axonos-boundary-run-v64`  
**Release class:** Public educational game / cognitive-boundary simulator  
**License:** `AGPL-3.0-only OR AxonOS Commercial License`  
**Creator / Founder / Maintainer:** Denis Yermakou

> Protect the choice. Protect the person.

## Summary

v64.1.0 hardens the one claim this project is built around — *deterministic, independently verifiable replay* — and gives the game a restrained, premium visual and UX pass. The deterministic simulation core is unchanged byte-for-byte, so every proof exported by v64.0.0 still verifies.

## Verifiable proof, now actually enforced in CI

- **Golden vectors.** Three committed replay proofs (`qa/proofs/golden-1..3.json`) covering a short run, a long run, and a minimal run.
- **Two-language verification on every push.** CI re-simulates each golden vector in Python (`tools/boundary_run_verify_v3.py`) *and* in JavaScript (`qa/replay_core_vectors.mjs`) and confirms both reach the identical canonical SHA-256. The determinism contract is now exercised, not merely asserted.
- **Strict verifier.** The verifier validates the schema, seed range and input-mask range; it **rejects** out-of-range input instead of silently normalising it; it bounds tick count; and it FAILS (non-zero exit) on any hash or outcome mismatch — including `bestCombo`, which is now re-simulated and bound. Tampering with any field is rejected.

## Premium pass

- A restrained, coherent palette replaces competing neon; one signal hue with purposeful accents.
- A clean on-canvas HUD (score, integrity, consent, combo, dash readiness) and quieter status messages.
- Game-first page layout: the canvas is the hero; documentation sits below.
- Game feel: incoming-hazard telegraph at the field edge, a dash afterimage trail, and a brief hit-punch on impact.

## Hygiene and supply chain

- Top-level `LICENSE` (full AGPL-3.0 text) so the license is auto-detected.
- Static-audit hardening checks now use explicit raises (they survive `python -O`); the telemetry scanner was broadened (`EventSource`, `importScripts`).
- The CI gate runner documents the real depth of each check rather than presenting every check as deep verification.

## Integrity reminder

This is an AxonOS Foundation Standard educational artifact — a browser game and a worked example of verifiable determinism. It is **not** a medical or BCI device, and it does not claim to be the full Rust → WebAssembly implementation described in the v64 technical target.
