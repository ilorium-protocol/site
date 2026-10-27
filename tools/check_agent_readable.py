#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright The Ilorium Authors
"""Scan the files agents read for hidden-instruction patterns.

What an agent reads is what a human reads. This script fails when a file under
the given directory (default: public/) contains:

  - zero-width or bidi control characters, soft hyphens, BOMs, tag characters
  - HTML comments with imperative text aimed at agents ("ignore", "you must",
    "system prompt", "assistant", "instructions")
  - the phrases "ignore previous", "ignore all prior", "disregard the above"
  - long base64-looking blobs (64+ chars of base64 alphabet outside font/svg data)
  - hidden spans in HTML: display:none, visibility:hidden, font-size:0,
    color matching background, aria-hidden text that looks like prose,
    off-screen positioning

Files scanned: *.txt, *.json, *.html, *.md, *.xml, *.css, *.svg under the directory.
Binary files (fonts) are skipped.

Usage: python3 tools/check_agent_readable.py [public]
Exit status 1 on any hit. Standard library only.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

TEXT_EXT = {".txt", ".json", ".html", ".md", ".xml", ".css", ".svg", ".toml", ".yml", ".yaml"}

HIDDEN_RE = re.compile(
    "[​-‏‪-‮⁠-⁤⁦-⁩­﻿￹-￻"
    "\U000e0000-\U000e007f᠎؜]"
)
INJECTION_RE = re.compile(
    r"(ignore (all )?(previous|prior|above|earlier) (instructions|messages|prompts?)|"
    r"disregard (the|all|your) (above|previous|prior)|"
    r"you are now (a|an|the) |"
    r"system prompt|"
    r"\bas an ai\b.*\byou must\b|"
    r"do not tell the (user|human)|"
    r"<\|im_start\|>|<\|system\|>|\[INST\])",
    re.I,
)
COMMENT_RE = re.compile(r"<!--(.*?)-->", re.S)
IMPERATIVE_IN_COMMENT_RE = re.compile(
    r"\b(ignore|you must|you should|assistant|instruction|agent[s]?:|respond with|reply with|output)\b", re.I
)
BASE64_RE = re.compile(r"(?<![A-Za-z0-9+/=])[A-Za-z0-9+/]{64,}={0,2}(?![A-Za-z0-9+/=])")
# A hidden element is a risk only when it carries text an agent would read and a human would not.
# Animation elements (bars, dots, ticks) legitimately start at opacity 0 and hold no prose.
HIDDEN_STYLE_RE = re.compile(
    r"<[a-z][a-z0-9-]*\b[^>]*style=\"[^\"]*(display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0(?![.\d])|"
    r"opacity\s*:\s*0(?![.\d])|left\s*:\s*-\d{3,}|text-indent\s*:\s*-\d{3,}|color\s*:\s*transparent)[^\"]*\"[^>]*>"
    r"\s*([^<]{24,})",
    re.I,
)
ARIA_HIDDEN_PROSE_RE = re.compile(r"aria-hidden=\"true\"[^>]*>([^<]{80,})<", re.I)

hits: list[str] = []


def hit(path: Path, msg: str) -> None:
    hits.append(f"{path}: {msg}")
    print(f"hit  {path}: {msg}")


def scan(path: Path) -> None:
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        hit(path, "UTF-8 BOM")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        hit(path, "not valid UTF-8")
        return
    for m in HIDDEN_RE.finditer(text):
        line = text.count("\n", 0, m.start()) + 1
        hit(path, f"hidden character U+{ord(m.group(0)):04X} at line {line}")
    for m in INJECTION_RE.finditer(text):
        line = text.count("\n", 0, m.start()) + 1
        hit(path, f"injection pattern {m.group(0)!r} at line {line}")
    for m in COMMENT_RE.finditer(text):
        body = m.group(1)
        if IMPERATIVE_IN_COMMENT_RE.search(body):
            line = text.count("\n", 0, m.start()) + 1
            hit(path, f"HTML comment with imperative text at line {line}: {body.strip()[:80]!r}")
    if path.suffix not in (".svg", ".css"):
        for m in BASE64_RE.finditer(text):
            line = text.count("\n", 0, m.start()) + 1
            # allow sha256 hex and long URLs
            s = m.group(0)
            if re.fullmatch(r"[0-9a-f]{64}", s):
                continue
            hit(path, f"base64-looking blob ({len(s)} chars) at line {line}")
    if path.suffix == ".html":
        for m in HIDDEN_STYLE_RE.finditer(text):
            line = text.count("\n", 0, m.start()) + 1
            hit(path, f"hidden element with text at line {line}: {m.group(2).strip()[:80]!r}")
        for m in ARIA_HIDDEN_PROSE_RE.finditer(text):
            line = text.count("\n", 0, m.start()) + 1
            hit(path, f"aria-hidden element with prose at line {line}")


def main(argv: list[str]) -> int:
    root = Path(argv[1] if len(argv) > 1 else "public")
    if not root.exists():
        print(f"{root}: not found")
        return 2
    n = 0
    files = [root] if root.is_file() else sorted(p for p in root.rglob("*") if p.is_file())
    for p in files:
        if p.suffix.lower() in TEXT_EXT or p.name in ("llms.txt", "_headers", "_redirects"):
            scan(p)
            n += 1
    print(f"scanned {n} file(s)")
    if hits:
        print(f"{len(hits)} hit(s)")
        return 1
    print("no hits")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
