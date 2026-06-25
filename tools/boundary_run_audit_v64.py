#!/usr/bin/env python3
# Created by Denis Yermakou, Founder & CEO of AxonOS.
from pathlib import Path
import sys, re
root = Path(__file__).resolve().parents[1]
forbidden = [r"fetch\s*\(", r"XMLHttpRequest", r"WebSocket", r"EventSource", r"sendBeacon", r"serviceWorker", r"navigator\.serviceWorker", r"importScripts\s*\("]
violations = []
scan_roots = [root / "index.html", root / "src"]
paths = []
for item in scan_roots:
    if item.is_file(): paths.append(item)
    elif item.is_dir(): paths.extend([p for p in item.rglob("*") if p.is_file()])
for path in paths:
    if path.suffix.lower() not in {".html", ".js", ".css", ".json"}: continue
    text = path.read_text(errors="ignore")
    for pat in forbidden:
        if re.search(pat, text):
            violations.append((str(path.relative_to(root)), pat))
if violations:
    print("FAIL: forbidden network/security patterns detected")
    for item in violations: print(" -", item[0], item[1])
    sys.exit(1)
required = ["README.md", "ATTRIBUTION.md", "SECURITY.md", "DONATIONS.md", "docs/TRACEABILITY_MATRIX.md", "docs/AxonOS_Boundary_Run_v64_Technical_Specification.md"]
missing = [p for p in required if not (root / p).exists()]
if missing:
    print("FAIL: missing required files", missing)
    sys.exit(1)
print("OK: Boundary Run v64 static audit passed")


# Hardening assertions added for v64 release blockers.
def _hardening_assertions():
    # Explicit raises (not bare assert) so checks are NOT stripped under `python -O`.
    idx = Path("index.html").read_text(encoding="utf-8", errors="replace")
    game = Path("src/game.js").read_text(encoding="utf-8", errors="replace")
    rel = Path("scripts/create_github_release_v64.sh").read_text(encoding="utf-8", errors="replace")
    lic = Path("LICENSE-AGPL").read_text(encoding="utf-8", errors="replace")
    checks = [
        ("CSP present", "Content-Security-Policy" in idx),
        ("referrer no-referrer", "no-referrer" in idx),
        ("proof hash sanitised", "replace(/[^a-f0-9]/gi" in game),
        ("WebCrypto guard present", "WebCrypto SHA-256 unavailable" in game),
        ("touch controls present", "touchstart" in game),
        ("no force tag in release script", "git tag -fa" not in rel),
        ("no auto-install in release script", "pkg install" not in rel),
        ("full AGPL text present", "GNU AFFERO GENERAL PUBLIC LICENSE" in lic),
    ]
    failed = [name for name, ok in checks if not ok]
    if failed:
        print("FAIL: hardening checks failed:", ", ".join(failed), file=sys.stderr)
        raise SystemExit(1)

_hardening_assertions()
