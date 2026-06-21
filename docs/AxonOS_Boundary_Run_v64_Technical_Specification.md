# Technical Specification: AxonOS Boundary Run v64
## “The Sovereign Signal” — Hardened Foundation Standard Edition

**Document Version:** 1.0.0-FINAL  
**Date:** 2026-06-21  
**Target Release:** v64.0.0  
**Creator / Founder / Maintainer:** Denis Yermakou  
**Project:** AxonOS Boundary Run v64  
**License:** AGPL-3.0-only OR AxonOS Commercial License  
**Repository:** `AxonOS-BCI/axonos-boundary-run-v64`  
**Live Build:** https://axonos-bci.github.io/axonos-boundary-run-v64/

---

## 1. Executive Summary

AxonOS Boundary Run v64 is the hardened Foundation Standard edition of the Boundary Run cognitive privacy simulator. It is a zero-telemetry browser game that maps gameplay mechanics to AxonOS concepts: safe-intent observation, consent boundaries, guardian co-authorisation, replay evidence, audit lanes, privacy vault semantics, and safe failure.

v64 exists to close the release blockers identified in v52: unsafe release tags, incomplete AGPL license text, proof-export filename sanitization, missing CSP posture, incomplete mobile controls, fragile attribution checks, and a mismatch between the implementation and the target Rust/WASM architecture.

---

## 2. Foundation vs Target Architecture

| Component | v64.0.0 Foundation | Target Architecture |
|-----------|-------------------|---------------------|
| Runtime | JavaScript static browser build | Rust → WebAssembly |
| RNG | mulberry32 deterministic JS stream | ChaCha20 deterministic WASM stream |
| Physics | bounded JS numeric simulation | Fixed-point Q16.16 |
| Replay proof | SHA-256 JSON payload proof | Merkle tree + byte-exact replay |
| Storage | local-only proof export | encrypted local persistence |
| Network | zero network APIs | zero network APIs |
| Controls | keyboard + touch | keyboard + touch + accessibility remapping |
| Security posture | CSP meta, frame guard, no service worker | CSP header, SRI, reproducible WASM |

This table is normative. Any README or release text must not claim that v64 is already Rust/WASM or ChaCha20-backed. The release is a hardened static Foundation implementation and a specification scaffold for the later WASM target.

---

## 3. Core Safety Invariants

1. **Zero telemetry:** runtime source must not contain `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, or service worker registration.
2. **Consent terminality:** `Withdrawn` is irreversible inside the current run.
3. **Proof locality:** replay proofs are generated locally and exported as user-controlled JSON.
4. **Proof filename sanitization:** exported filenames derive only from lowercase/uppercase hex stripped through `/[^a-f0-9]/gi`.
5. **Frame isolation:** the static build refuses embedded iframe execution using a best-effort runtime frame guard.
6. **Attribution integrity:** primary attribution files must preserve `Denis Yermakou`.
7. **Donation-address integrity:** the Dogecoin address must be present in README, DONATIONS, and runtime HTML.
8. **No bot contributors:** CI must not create commits; publishing is maintainer-run.

---

## 4. Game Mechanics Mapping

| Game Mechanic | AxonOS Concept | v64 Implementation File |
|---------------|----------------|-------------------------|
| Ari courier | Safe-intent observation | `src/game.js` |
| Kibo guardian | Guardian co-authorisation | `src/game.js` |
| Consent state | Granted → Suspended → Withdrawn | `src/game.js` |
| Raw signal zone | structural privacy violation simulation | `src/game.js` |
| Audit lane | traceability/evidence | `src/game.js` |
| Sealed vault | privacy vault protection | `src/game.js` |
| Stimulation beam | coercion hazard | `src/game.js` |
| Export proof | replay evidence | `src/game.js` |
| Codex | educational content | `index.html`, `src/game.js` |

---

## 5. Security Requirements

### 5.1 Required Static Checks

The following commands must pass before release:

```bash
node qa/boundary-run-static-smoke-v64.mjs
python3 tools/boundary_run_audit_v64.py
bash scripts/verify_no_sw.sh
bash scripts/verify_donation_address.sh
bash scripts/verify_attribution.sh
bash scripts/reproducibility_check.sh
```

### 5.2 CSP

GitHub Pages cannot emit custom HTTP CSP headers from repository content. v64 therefore uses a CSP meta tag plus a JavaScript frame guard. A production host should additionally set an HTTP header equivalent to:

```text
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'
```

### 5.3 Release Tag Safety

Release scripts must never use `git tag -f`, `git tag -fa`, or `git push -f origin <tag>`. The safe release path aborts if the tag exists locally or on remote.

### 5.4 Tooling Safety

Release scripts must not auto-install tools. Missing `gh`, `node`, `python3`, `zip`, `tar`, or `sha256sum` must fail fast with clear messages.

---

## 6. CI/CD Model

v64 uses read-only CI gates and a botless contributor policy.

- `ci.yml`: 57 verification gates, read-only permissions.
- `release.yml`: manual release-asset verification only; no tag mutation.
- `dependabot.yml`: may open PRs only. Maintainer should re-commit dependency changes manually if contributor graph hygiene is required.
- `deploy_pages_branch.sh`: maintainer-run deployment to `gh-pages`.

No workflow should commit to `main` or `gh-pages` as `github-actions[bot]`.

---

## 7. Release Checklist

- [ ] `VERSION` equals `64.0.0`
- [ ] README launch link points to `/axonos-boundary-run-v64/`
- [ ] Full `LICENSE-AGPL` text present
- [ ] `LICENSE-COMMERCIAL` present
- [ ] Dogecoin donation address present in README, DONATIONS, and index
- [ ] `Denis Yermakou` attribution present in core files
- [ ] smoke/audit/no-sw/donation/attribution/reproducibility checks pass
- [ ] `create_github_release_v64.sh` contains no tag force operations
- [ ] no service worker code present
- [ ] no GitHub Action creates commits
- [ ] Pages uses `gh-pages` branch source

---

## 8. Final Verdict

v64.0.0 is a hardened Foundation Standard release. It is suitable for public release as a static educational browser game and as a specification bridge toward the later Rust/WASM deterministic implementation.

**Release verdict:** GO after local checks pass and the maintainer publishes `main`, `gh-pages`, tag `v64.0.0`, and GitHub Release assets.
