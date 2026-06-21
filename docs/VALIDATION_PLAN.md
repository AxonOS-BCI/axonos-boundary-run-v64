# Validation Plan

## Standing gates

1. HTML entry point exists.
2. Manifest exists and points to the GitHub Pages path.
3. Game JavaScript passes syntax check.
4. Mocked browser smoke test starts the game without crashing.
5. No patch artifacts are shipped in the release archive.
6. Version file equals `64.0.0`.

## Manual playability checklist

- Start button resets a run.
- Left/right movement responds.
- Jump avoids low artifacts.
- Duck avoids gold beams.
- Vault pickup restores integrity.
- Consent gate suspends consent.
- Holding `E` restores suspended consent.
- `R` withdraws consent and seals the run.
- Export proof creates a JSON artifact in browser.

## Evidence limits

This archive was smoke-tested in a mocked browser/canvas environment. It was not tested against a live GitHub Pages deployment in this environment.
