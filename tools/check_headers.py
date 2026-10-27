#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright The Ilorium Authors
"""Check the response headers of a deployed origin against public/_headers.

Usage:
    python3 tools/check_headers.py https://ilorium.com [--path /] [--no-extras]

It is meant for the deployed origin (Cloudflare Pages applies public/_headers).
A local `python3 -m http.server` does not send these headers and will fail.

Prints one line per expected header: observed / missing / differs.
Exit status 1 when any header is missing or differs, 0 otherwise.
Standard library only.
"""

from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.request

EXPECTED: dict[str, str] = {
    "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
    "content-security-policy": ("default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
                                "font-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'; "
                                "frame-ancestors 'none'; upgrade-insecure-requests"),
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
    "x-frame-options": "DENY",
    "cross-origin-opener-policy": "same-origin",
}

# Extra expectations for the agent-readable files.
EXPECTED_BY_PATH: dict[str, dict[str, str]] = {
    "/llms.txt": {"access-control-allow-origin": "*", "content-type": "text/plain; charset=utf-8"},
    "/.well-known/ilorium.json": {"access-control-allow-origin": "*",
                                  "content-type": "application/json; charset=utf-8"},
    "/.well-known/security.txt": {"access-control-allow-origin": "*",
                                  "content-type": "text/plain; charset=utf-8"},
}


def fetch_headers(url: str) -> tuple[int, dict[str, str]]:
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "ilorium-check-headers/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, {k.lower(): v for k, v in resp.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}


def normalize(value: str) -> str:
    return " ".join(value.replace(";", "; ").split()).rstrip(";").lower()


def check(origin: str, path: str, expected: dict[str, str]) -> int:
    url = origin.rstrip("/") + path
    try:
        status, headers = fetch_headers(url)
    except (urllib.error.URLError, OSError) as e:
        print(f"{url}: request failed: {e}")
        return 1
    print(f"{url} -> HTTP {status}")
    failures = 0
    for name, want in expected.items():
        got = headers.get(name)
        if got is None:
            print(f"  missing   {name}")
            failures += 1
        elif normalize(got) == normalize(want):
            print(f"  observed  {name}: {got}")
        else:
            print(f"  differs   {name}: {got}")
            print(f"            expected: {want}")
            failures += 1
    return failures


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Check security headers of a deployed Ilorium site origin.")
    ap.add_argument("origin", help="origin to test, e.g. https://ilorium.com")
    ap.add_argument("--path", default="/", help="path for the main check (default /)")
    ap.add_argument("--no-extras", action="store_true", help="skip llms.txt and .well-known checks")
    ap.add_argument("--allow-http", action="store_true",
                    help="accept an http:// origin (only for testing the script against a local server)")
    args = ap.parse_args(argv)
    if not args.origin.startswith("https://") and not (args.allow_http and args.origin.startswith("http://")):
        print("origin must start with https:// (use --allow-http only for a local test server)")
        return 2
    failures = check(args.origin, args.path, EXPECTED)
    if not args.no_extras:
        for path, extra in EXPECTED_BY_PATH.items():
            failures += check(args.origin, path, {**EXPECTED, **extra})
    if failures:
        print(f"{failures} header(s) missing or different")
        return 1
    print("all expected headers observed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
