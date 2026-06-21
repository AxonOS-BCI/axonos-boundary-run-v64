# AxonOS Boundary Run v64 — The Sovereign Signal

Zero-telemetry cognitive privacy runner by Denis Yermakou / AxonOS.

## Scope

This repository is a browser-based game and engineering demonstrator for consent boundaries, replay proof export, and cognitive privacy UX. It is not a medical device, not a BCI diagnostic tool, and not a clinical product.

## Run locally

Open `index.html` in a modern browser or serve the folder with any static HTTP server.

Controls:

- `A/D` or `←/→` — move
- `W`, `↑`, or `Space` — jump
- `S` or `↓` — duck under beams
- `R` — revoke consent
- `E` — resume after suspended consent
- `P` — pause

## What is included

- Playable canvas runner loop
- Deterministic seeded hazard stream per UTC day
- Consent state machine: `Granted`, `Suspended`, `Withdrawn`
- SHA-256 proof export using browser `SubtleCrypto`
- Touch controls for mobile
- Colorblind display mode
- Strict iframe refusal
- Zero telemetry and no network dependency

## What is not claimed

- No medical claim
- No clinical validation
- No real BCI hardware integration
- No measured WCET/latency/power claim
- No trained neural model
- No user tracking

## Release gate

Before upload:

```bash
npm test
```

The smoke test runs the game script in a mocked browser/canvas environment and validates that the game loop initializes without a JavaScript crash.
