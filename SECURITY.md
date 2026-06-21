# Security Policy

## Zero-telemetry security posture

Boundary Run v64 must not perform network communication during gameplay or proof export.

Forbidden APIs in source and build output:

- `fetch()`
- `XMLHttpRequest`
- `WebSocket`
- `sendBeacon`
- service worker registration
- external CDN script/style loading

Additional protections:
- CSP meta tag with `frame-ancestors 'none'` prevents clickjacking
- Proof export filename is sanitized (hex-only)
- Error handling for `crypto.subtle.digest` failures

## Reporting vulnerabilities

Report security issues to: `security@axonos.org`.

Project creator and maintainer: **Denis Yermakou**.

Coordinated disclosure target: 90 days.
Initial response target: 72 hours.

Do not include real neural data, private medical information, private keys, or secrets in an issue.

## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.

## CSP and Clickjacking

v64 includes a CSP meta tag and a best-effort JavaScript frame guard. On hosts that support custom HTTP headers, set `frame-ancestors 'none'` as an HTTP CSP header. GitHub Pages does not support repository-defined custom security headers.
