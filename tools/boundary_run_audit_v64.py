#!/usr/bin/env python3
# Created by Denis Yermakou, Founder & CEO of AxonOS.
from pathlib import Path
import sys, re

root = Path(__file__).resolve().parents[1]

forbidden_runtime = [r"fetch\s*\(", r"XMLHttpRequest", r"WebSocket", r"sendBeacon", r"serviceWorker", r"navigator\.serviceWorker"]
violations = []
paths = []
for item in [root / "index.html", root / "src"]:
    if item.is_file():
        paths.append(item)
    elif item.is_dir():
        paths.extend([p for p in item.rglob("*") if p.is_file()])
for path in paths:
    if path.suffix.lower() not in {".html", ".js", ".css", ".json"}: continue
    text = path.read_text(errors="ignore")
    for pat in forbidden_runtime:
        if re.search(pat, text):
            violations.append((str(path.relative_to(root)), pat))
if violations:
    print("FAIL: forbidden network/security patterns detected")
    for item in violations: print(" -", item[0], item[1])
    sys.exit(1)

required = [
    "README.md", "ATTRIBUTION.md", "SECURITY.md", "DONATIONS.md", "LICENSE-AGPL", "LICENSE-COMMERCIAL",
    "package.json", "docs/TRACEABILITY_MATRIX.md", "docs/AxonOS_Boundary_Run_v64_Technical_Specification.md",
    "scripts/create_github_release_v64.sh", "scripts/deploy_pages_branch.sh", ".github/dependabot.yml"
]
missing = [p for p in required if not (root / p).exists()]
if missing:
    print("FAIL: missing required files", missing)
    sys.exit(1)

html = (root / "index.html").read_text(errors="ignore")
if "Content-Security-Policy" not in html or "frame-ancestors" not in html:
    print("FAIL: CSP meta tag/frame-ancestors missing from index.html")
    sys.exit(1)
if "DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp" not in html:
    print("FAIL: donation address missing from runtime HTML")
    sys.exit(1)

game = (root / "src/game.js").read_text(errors="ignore")
for needle in ["replace(/[^a-f0-9]/gi", "crypto.subtle.digest failed", "touchstart", "isNaN(state.x)", "Frame embedding blocked"]:
    if needle not in game:
        print(f"FAIL: game hardening marker missing: {needle}")
        sys.exit(1)

release = (root / "scripts/create_github_release_v64.sh").read_text(errors="ignore")
for bad in ["git tag -f", "git tag -fa", "git push -f origin", "pkg install"]:
    if bad in release:
        print(f"FAIL: unsafe release pattern found: {bad}")
        sys.exit(1)

agpl = (root / "LICENSE-AGPL").read_text(errors="ignore")
if "GNU AFFERO GENERAL PUBLIC LICENSE" not in agpl or "END OF TERMS AND CONDITIONS" not in agpl:
    print("FAIL: full AGPL text missing")
    sys.exit(1)

print("OK: Boundary Run v64 static audit passed")
