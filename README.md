<div align="center">

# AxonOS Boundary Run

### The quintessence of AxonOS — made playable.

**A deterministic, replay-verifiable arcade game that turns the AxonOS thesis into something you can feel in your hands: keep typed intent flowing, keep raw signal out, and prove the whole run with cryptography.**

[**▶ Play**](https://axonos-bci.github.io/axonos-boundary-run-v64/) · [axonos.org](https://axonos.org) · [The AxonOS Project](https://github.com/AxonOS-org)

</div>

---

> **What this is.** An **educational / brand artifact** — an interactive way to understand what AxonOS stands for. It is *not* a brain-computer interface, uses no neural data, and is **not** evidence of BCI functionality. It demonstrates the *philosophy and engineering posture* of AxonOS, not a clinical or product claim.

## The quintessence it distills

AxonOS exists to keep one promise: **applications receive typed, consent-bound intent — never raw neural signal — across a deterministic, auditable boundary.** This game makes each part of that promise tangible:

| You experience… | …which is AxonOS' real capability |
|:--|:--|
| You pilot the **Sovereign Signal** — a single *typed intent* — through the field. | The application boundary: apps see typed `IntentObservation`, never raw streams. |
| **Raw Signal** zones and **Artifacts** damage you; you dodge, or **dash-purge** through them. | The boundary rejects unrestricted raw cognition and degraded data. |
| **Sealed Vaults** restore integrity and build combo. | Consent-granted, capability-gated operation. |
| Stale **consent gates** suspend you (~3 s, scoring paused, auto-resume); integrity loss ends the run as **Withdrawn**. | The consent FSM — `Granted → Suspended → Withdrawn`, where **Withdrawn is terminal**. |
| **FAST** band doubles score but drains; **AUDIT** band restores. | Operational modes under a real-time contract. |
| Every run exports a **proof** whose hash is re-derived independently. | Determinism: the same inputs reproduce the same result, verifiably. |

## Verifiable replay proof — the headline

The simulation is fully deterministic: a fixed 60 Hz timestep, one seeded RNG, exact integer/IEEE-754 arithmetic, **no transcendental functions in the simulation**. Every run produces a canonical SHA-256 over `(seed, inputs, outcome)`.

That proof is **independently re-simulated in a second language**: [`tools/boundary_run_verify_v3.py`](tools/boundary_run_verify_v3.py) replays an exported proof from its seed and input log and confirms the hash byte-for-byte. Tampered scores do not verify. This is the same determinism discipline the AxonOS kernel is built on, shrunk to something you can run in one command:

```bash
python3 tools/boundary_run_verify_v3.py my-run-proof.json
# -> OK: replay proof verified by independent Python re-simulation
```

## How to play

- **Move:** arrow keys or **WASD** (**A/D** strafe, **W/S** vertical) — free 2-D movement.
- **Dash:** `Shift` or `K` (two-finger tap on touch) — a burst with brief invulnerability; dash *through* a red Raw or purple Artifact to **purge** it for points and keep your combo. On a cooldown.
- **Goal:** survive, bank Vaults, ride the FAST band for score, keep integrity above zero. Grab near-misses and chain combos; survive the **surge waves**.
- **Pause:** `P`. **Colourblind mode** and **Export proof** are in the HUD. On mobile, drag to steer.

## Privacy

Runs entirely in your browser. **No backend**, no accounts, no tracking — **zero-telemetry** by construction (verified in CI). The only network-free artifact you can produce is a local proof file you choose to share.

## Implementation Status

| Area | State |
|:--|:--|
| Deterministic engine + cross-language replay proof | Implemented, CI-verified (node ↔ Python) |
| Gameplay (movement, dash-purge, combos, surge, bands, consent FSM) | Implemented |
| Premium render (directional avatar, parallax, particles, glass HUD) | Implemented |
| Privacy (no backend, zero-telemetry) | Implemented, CI-verified |
| Relationship to the AxonOS kernel/SDK | Illustrative only — this is a brand/education artifact, not the product |

## Build & verify locally

```bash
bash scripts/build_web.sh dist          # build the static bundle
bash scripts/reproducibility_check.sh   # deterministic rebuild check
node  qa/boundary-run-static-smoke-v64.mjs
python3 tools/boundary_run_audit_v64.py
```

CI runs a full gate suite on every push, including the determinism and zero-telemetry checks.

## The real AxonOS

This game is the front door, not the building. The engineering lives under [**AxonOS-org**](https://github.com/AxonOS-org): the [Standard](https://github.com/AxonOS-org/axonos-standard), the Rust `#![no_std]` [kernel](https://github.com/AxonOS-org/axonos-kernel), the [consent FSM](https://github.com/AxonOS-org/axonos-consent), the [SDKs](https://github.com/AxonOS-org/axonos-sdk), and a reproducible [end-to-end intent-flow demo](https://github.com/AxonOS-org/axonos-e2e-demo).

## Support

This is an independent, open project. If it is useful to you, contributions are welcome (entirely optional):

- **Dogecoin:** `DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp`

## License

Dual-licensed: [AGPL-3.0-only](LICENSE-AGPL) for open use, or a [commercial license](LICENSE-COMMERCIAL). Created by **Denis Yermakou**.

---

<div align="center">
<sub>© The AxonOS Project / Denis Yermakou · <a href="https://axonos.org">axonos.org</a> · connect@axonos.org · security@axonos.org</sub>
</div>
