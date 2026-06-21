# Changelog

## v64.0.0 — Foundation Standard — 2026-06-21

### Added

- CSP meta tag with `frame-ancestors 'none'` for clickjacking protection.
- Mobile touch controls (touchstart/touchend on game stage).
- Error handling in `finalizeProof()` for `crypto.subtle` failures.
- Filename sanitization in proof export (hex-only filter).
- NaN/state corruption detection in game loop.
- `aria-live` regions for screen reader accessibility.
- Touch control hints for mobile devices.
- Screen shake effect on collision.
- Particle effects on hits and vault collection.
- Glow effect on hazard hits.
- Combo counter for consecutive vaults.
- Full player sprite (head, body, arms, legs, shadow, guardian halo).
- Weather-tinted backgrounds (Storm, Solar Flare).
- Hazard labels (GATE, VAULT, RAW).
- All 5 hazard types now spawn correctly (vault was dead code before).

### Fixed

- CRIT-004: Force-delete git tags → safe tag creation with existence checks.
- CRIT-005: Auto-install `gh` CLI → fail-fast with clear error message.
- CRIT-006: Unsanitized proof filename → hex-only sanitization.
- CRIT-007: Missing CSP → added comprehensive CSP meta tag.
- CRIT-009: Missing touch controls → added touch event handlers.
- CRIT-014: Missing crypto error handling → wrapped in try/catch.
- CRIT-015: Excessive attribution checks → reduced to 7 files.
- CRIT-019: Spec/implementation mismatch → added Foundation vs Target table.
- GAMEPLAY-001: Player sinking into floor → fixed body positioning.
- GAMEPLAY-002: Vault never spawning → fixed spawnHazard type selection.
- GAMEPLAY-003: Sluggish movement → increased acceleration (9000 vs 5600).
- GAMEPLAY-004: Slow world speed → increased to 3.8 from 3.25.

### Known limitations

- Current runtime is static JavaScript/Canvas Foundation implementation.
- Final Rust/WASM deterministic simulation core remains a roadmap target.
- Formal Kani/fuzz/WCRT proof chain is not claimed complete in this Foundation release.

## v52.0.0 — Foundation Standard — 2026-06-21

### Added

- Initial public Foundation Standard release for AxonOS Boundary Run.
- Static playable browser game implementation.
- Zero-telemetry audit tooling.
- Release packaging and GitHub Release automation.

## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.