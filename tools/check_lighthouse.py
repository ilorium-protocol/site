#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright The Ilorium Authors
"""Validate the Lighthouse files: public/.well-known/ilorium.json and public/llms.txt.

Checks:
  ilorium.json  strict JSON (no duplicate keys, no trailing commas, UTF-8, no BOM);
                every URL is https; every URL on ilorium.com resolves to a file under
                public/ (or a documented redirect); every object marked "planned" has no
                "url" that claims to exist; nothing is marked "available" without a URL
                that resolves; no hidden characters in any string.
  llms.txt      starts with an H1 and a blockquote; no hidden characters (zero-width,
                bidi controls, soft hyphen, BOM, tag characters, control characters
                except newline and tab); no HTML comments; every ilorium.com URL
                resolves under public/.
  security.txt  has Contact, Expires, Canonical; Expires is in the future.

Usage: python3 tools/check_lighthouse.py [--public public]
Exit status 1 on any finding. Standard library only.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
import sys
import unicodedata
from pathlib import Path

SITE = "https://ilorium.com"

HIDDEN_RE = re.compile(
    "[​-‏‪-‮⁠-⁤⁦-⁩­﻿￹-￻"
    "\U000e0000-\U000e007f᠎؜ᅟᅠㅤﾠ]"
)
CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
REDIRECTS: set[str] = set()
# Pages produced by Astro (src/pages), not present under public/ before `astro build`.
ASTRO_PAGES = {"/", "/protocol", "/radiant", "/organisms/organism-zero", "/docs", "/codex", "/ext/a2a/v1", "/404"}

findings: list[str] = []


def finding(msg: str) -> None:
    findings.append(msg)
    print(f"finding   {msg}")


def ok(msg: str) -> None:
    print(f"observed  {msg}")


def no_dupes(pairs):
    d = {}
    for k, v in pairs:
        if k in d:
            raise ValueError(f"duplicate key: {k}")
        d[k] = v
    return d


def hidden_chars(text: str, where: str) -> None:
    for m in HIDDEN_RE.finditer(text):
        ch = m.group(0)
        finding(f"{where}: hidden character U+{ord(ch):04X} ({unicodedata.name(ch, 'unknown')}) at offset {m.start()}")
    for m in CONTROL_RE.finditer(text):
        finding(f"{where}: control character U+{ord(m.group(0)):04X} at offset {m.start()}")
    for m in re.finditer(r"[ ]", text):
        finding(f"{where}: non-breaking space at offset {m.start()}")


def local_path_for(url: str, public: Path) -> Path | None:
    if not url.startswith(SITE + "/") and url != SITE:
        return None
    path = url[len(SITE):] or "/"
    path = path.split("#", 1)[0].split("?", 1)[0]
    if path in REDIRECTS or path.rstrip("/") in ASTRO_PAGES or path in ASTRO_PAGES:
        return public  # treated as resolving
    p = public / path.lstrip("/")
    if path.endswith("/"):
        p = p / "index.html"
    if p.is_file():
        return p
    if p.is_dir() and (p / "index.html").is_file():
        return p / "index.html"
    return None


def walk(obj, path: str, public: Path, urls: list[tuple[str, str]]) -> None:
    if isinstance(obj, dict):
        status = obj.get("status")
        if status == "planned":
            for k in ("url", "endpoint", "href"):
                if k in obj and obj[k]:
                    finding(f"{path}: marked planned but carries {k}={obj[k]!r}")
        if status in ("available", "live", "stable"):
            if not any(k in obj for k in ("url", "href", "repository")):
                finding(f"{path}: marked {status} without a URL")
        for k, v in obj.items():
            if isinstance(k, str):
                hidden_chars(k, f"{path}.{k} (key)")
            walk(v, f"{path}.{k}", public, urls)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            walk(v, f"{path}[{i}]", public, urls)
    elif isinstance(obj, str):
        hidden_chars(obj, path)
        if re.match(r"^[a-z][a-z0-9+.-]*://", obj, re.I):
            urls.append((path, obj))
        if "status" in path.lower() and obj.lower() in ("available", "live"):
            pass  # handled at the object level


def check_json(public: Path) -> None:
    p = public / ".well-known" / "ilorium.json"
    if not p.is_file():
        finding("ilorium.json: missing")
        return
    raw = p.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        finding("ilorium.json: has a UTF-8 BOM")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        finding(f"ilorium.json: not UTF-8 ({e})")
        return
    try:
        data = json.loads(text, object_pairs_hook=no_dupes)
    except ValueError as e:
        finding(f"ilorium.json: not strict JSON ({e})")
        return
    ok("ilorium.json: strict JSON, no duplicate keys")
    if not isinstance(data, dict):
        finding("ilorium.json: top level is not an object")
        return
    top = data
    for key in ("name", "site", "release", "governance", "repository", "documents", "lighthouse",
                "contact", "policy", "updated"):
        if key not in top:
            finding(f"ilorium.json: {key} missing")
    if not isinstance(top.get("release"), dict) or top["release"].get("status") != "draft":
        finding("ilorium.json: release.status is not 'draft'")
    if not isinstance(top.get("governance"), dict) or top["governance"].get("stage") != "interim":
        finding("ilorium.json: governance.stage is not 'interim'")
    if isinstance(top.get("organisms"), dict) and top["organisms"].get("in_operation") not in (0, None):
        finding("ilorium.json: organisms.in_operation is not 0; check that it is true")
    for d in top.get("documents") or []:
        if isinstance(d, dict) and d.get("status") == "draft" and not d.get("html"):
            finding(f"ilorium.json: document {d.get('id')} has no html URL")
    urls: list[tuple[str, str]] = []
    walk(top, "ilorium.json", public, urls)
    for where, url in urls:
        if not url.startswith("https://") and not url.startswith("mailto:"):
            finding(f"{where}: not https: {url}")
        if url.startswith(SITE):
            if local_path_for(url, public) is None:
                finding(f"{where}: {url} does not resolve to a file under public/")
    ok(f"ilorium.json: {len(urls)} URLs checked")


def check_llms(public: Path) -> None:
    p = public / "llms.txt"
    if not p.is_file():
        finding("llms.txt: missing")
        return
    raw = p.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        finding("llms.txt: has a UTF-8 BOM")
    text = raw.decode("utf-8", errors="replace")
    if "�" in text:
        finding("llms.txt: invalid UTF-8")
    hidden_chars(text, "llms.txt")
    lines = text.splitlines()
    if not lines or not lines[0].startswith("# "):
        finding("llms.txt: first line is not an H1")
    stripped = [l for l in lines[1:] if l.strip()]
    if not stripped or not stripped[0].startswith("> "):
        finding("llms.txt: no blockquote summary after the H1")
    if "<!--" in text or re.search(r"<(/?[a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>", text):
        # placeholders like <domain> or <your-domain> are allowed; real tags are not
        for m in re.finditer(r"<(/?[a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>", text):
            if m.group(1).lstrip("/").lower() in ("a", "p", "div", "span", "script", "style", "img", "br",
                                                    "html", "body", "head", "meta", "link", "iframe", "b",
                                                    "i", "u", "em", "strong", "h1", "h2", "h3", "ul", "li"):
                finding(f"llms.txt: contains HTML tag {m.group(0)!r}")
        if "<!--" in text:
            finding("llms.txt: contains an HTML comment")
    for m in re.finditer(r"https?://[^\s)>\]]+", text):
        url = m.group(0).rstrip(".,;")
        if url.startswith("http://"):
            finding(f"llms.txt: not https: {url}")
        if url.startswith(SITE) and local_path_for(url, public) is None:
            finding(f"llms.txt: {url} does not resolve under public/")
    for phrase in ("available now", "is live", "now available", "is in production"):
        if phrase in text.lower():
            finding(f"llms.txt: contains '{phrase}'; check that it is true")
    if re.search(r"(?<!no )organism is running", text, re.I):
        finding("llms.txt: says an organism is running; check that it is true")
    ok("llms.txt: structure and characters checked")


def check_security_txt(public: Path) -> None:
    p = public / ".well-known" / "security.txt"
    if not p.is_file():
        finding("security.txt: missing")
        return
    text = p.read_text(encoding="utf-8")
    hidden_chars(text, "security.txt")
    fields = dict(re.findall(r"^([A-Za-z-]+):\s*(.+)$", text, re.M))
    for f in ("Contact", "Expires", "Canonical"):
        if f not in fields:
            finding(f"security.txt: {f} missing")
    exp = fields.get("Expires")
    if exp:
        try:
            when = _dt.datetime.fromisoformat(exp.replace("Z", "+00:00"))
            if when <= _dt.datetime.now(_dt.timezone.utc):
                finding(f"security.txt: Expires is in the past ({exp})")
            elif when > _dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(days=366):
                finding(f"security.txt: Expires is more than a year away ({exp})")
        except ValueError:
            finding(f"security.txt: Expires not ISO 8601 ({exp})")
    ok("security.txt: fields checked")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Validate the Lighthouse files.")
    ap.add_argument("--public", default="public")
    args = ap.parse_args(argv)
    public = Path(args.public)
    check_json(public)
    check_llms(public)
    check_security_txt(public)
    if findings:
        print(f"{len(findings)} finding(s)")
        return 1
    print("no findings")
    return 0


if __name__ == "__main__":
    sys.exit(main())
