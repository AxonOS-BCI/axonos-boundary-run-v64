# Claims

## L1 — Machine-checkable in this repository

- The game has no external JavaScript dependency.
- `src/game.js` parses under Node.js syntax check.
- The browser smoke test initializes the game loop with mocked DOM/canvas APIs.
- Proof export path uses SHA-256 through `SubtleCrypto` when available.

## L2 — Design claims

- The game models consent states as a UX metaphor: `Granted`, `Suspended`, `Withdrawn`.
- The game is intended to be zero-telemetry and static-hosting friendly.

## Not claimed

- Medical safety.
- Clinical validity.
- Real neural signal processing.
- Hardware BCI integration.
- Measured latency, accuracy, WCET, or power consumption.
