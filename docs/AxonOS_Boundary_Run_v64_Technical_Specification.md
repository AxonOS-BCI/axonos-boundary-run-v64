# AxonOS Boundary Run v64 — Technical Specification

**Version:** v64.0.0 Foundation Standard
**Date:** 2026-06-21
**Author:** Denis Yermakou, Founder & CEO of AxonOS

## Overview

AxonOS Boundary Run v64 is a zero-telemetry browser-based game that serves as an educational artifact for cognitive privacy, consent boundaries, and deterministic replay proofs. It implements an AxonOS-style Consent State Machine (CSM) within a playable game loop.

## Architecture

### Foundation vs Target

| Component | v64.0.0 Foundation | Target Architecture |
|-----------|-------------------|-------------------|
| RNG | mulberry32 (JS) | ChaCha20 (WASM) |
| Physics | JS float emulation | Fixed-point Q16.16 |
| Runtime | JavaScript | Rust → WASM |
| Proof | SHA-256 payload | Merkle tree + byte-exact replay |
| Mobile | Touch controls (JS) | Native touch (WASM) |

## Game Mechanics

### Consent State Machine

```
Granted → Suspended → Withdrawn
   ↑___________↓
```

- **Granted**: Normal operation. Player can move, jump, collect vaults.
- **Suspended**: Operation reduced. Player must press `E` 30 times to resume.
- **Withdrawn**: Terminal state. Game over. Proof generated.

### Hazard Types

| Type | Effect | Visual |
|------|--------|--------|
| artifact | -22% integrity, knockback | Purple diamond |
| raw | -60% integrity | Red triangle |
| beam | +26% horizontal velocity, -11% integrity | Yellow vertical beam |
| gate | Sets consent to Suspended | Grey rectangle with border |
| vault | +40% integrity, combo +1 | Gold rounded rectangle |

### Player

- Position: Fixed-point Q16.16 (emulated in JS)
- Hitbox: 36×50px centered on body
- Sprite: Head, body, arms, legs, shadow, guardian halo

### Physics

- Gravity: 48000 Q-units/frame²
- Jump velocity: -1100000 Q-units/frame
- Max horizontal velocity: ±420000 Q-units/frame
- Acceleration: ±9000 Q-units/frame²
- Friction: 0.90 per frame

## Security

### Zero-Telemetry Posture

- No `fetch()`
- No `XMLHttpRequest`
- No `WebSocket`
- No `navigator.sendBeacon`
- No service worker
- No external CDN assets

### Protections

- CSP meta tag with `frame-ancestors 'none'`
- JS frame guard: `window.top !== window.self`
- Proof filename sanitization: hex-only
- Crypto.subtle error handling with try/catch
- NaN/state corruption detection

## Replay System

### Proof Format

```json
{
  "seed": 1234567890,
  "frames": 3600,
  "score": 15420,
  "consent": "Granted",
  "proof": "a1b2c3d4e5f6...",
  "inputLog": [[1, 0, 65536, "Granted"], ...]
}
```

### Verification

1. Hash the JSON payload with SHA-256
2. First 16 hex chars = proof ID
3. Full hash stored in proof field

## Build System

### Scripts

- `build_web.sh` — static distribution
- `package_release.sh` — release assets
- `create_github_release_v64.sh` — GitHub release (safe, no force)
- `deploy_pages_branch.sh` — manual Pages deploy
- `verify_attribution.sh` — attribution check (7 files)
- `verify_no_sw.sh` — service worker check
- `verify_donation_address.sh` — donation address check
- `reproducibility_check.sh` — deterministic build check

### CI/CD

- `ci.yml` — 57 verification gates, read-only permissions
- `release.yml` — manual dispatch, builds assets
- No `pages.yml` (botless policy)

## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.