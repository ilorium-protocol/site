#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright The Ilorium Authors
"""Check the built site: internal links resolve, HTML is well formed, no scripts.

For every .html file under the directory (default: public/):
  - parses it with html.parser; reports unbalanced tags among a set of
    container tags, a missing <title>, missing lang, missing charset
  - reports <iframe>, <object>, <embed>, inline event handlers, javascript: URLs,
    external <script src>, and inline <script> whose SHA-256 is not in _headers
    (Astro emits a few, hashed into the CSP by scripts/gen-headers.mjs)
  - reports any href/src that points to another origin for a resource
    (stylesheet, image, font); links (<a href>) may point anywhere
  - checks every internal href/src (absolute path or relative) resolves to a
    file under the directory; fragments are checked against ids in the target
    when the target is HTML

Also checks sitemap.xml: every <loc> under https://ilorium.com resolves.

Usage: python3 tools/check_site.py [public]
Exit status 1 on any finding. Standard library only. No network.
"""

from __future__ import annotations

import base64
import hashlib
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

SITE = "https://ilorium.com"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
CHECK_BALANCE = {"html", "head", "body", "main", "nav", "footer", "div", "ul", "ol", "li", "table",
                 "thead", "tbody", "tr", "td", "th", "p", "a", "pre", "code", "h1", "h2", "h3", "h4",
                 "blockquote", "section", "article", "aside", "span", "strong", "em", "figure"}
RESOURCE_TAGS = {"link": "href", "img": "src", "source": "src", "script": "src"}
REDIRECTS: set[str] = set()

findings: list[str] = []


def finding(msg: str) -> None:
    findings.append(msg)
    print(f"finding  {msg}")


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[str] = []
        self.ids: set[str] = set()
        self.links: list[tuple[str, str, str]] = []  # (tag, attr, value)
        self.title = False
        self.lang = False
        self.charset = False
        self.problems: list[str] = []
        self.in_title = False
        self.title_text = ""
        self.cdata = False
        self.in_script = False
        self.script_text = ""
        self.inline_scripts: list[str] = []

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        a = dict(attrs)
        if tag == "html" and a.get("lang"):
            self.lang = True
        if tag == "meta" and (a.get("charset") or (a.get("http-equiv", "").lower() == "content-type")):
            self.charset = True
        if tag == "title":
            self.title = True
            self.in_title = True
        if tag in ("iframe", "object", "embed", "applet", "frame"):
            self.problems.append(f"<{tag}> at line {self.getpos()[0]}")
        if tag == "script":
            src = a.get("src")
            if src is None:
                self.in_script = True
                self.script_text = ""
            elif re.match(r"^[a-z][a-z0-9+.-]*:|^//", src, re.I) and not src.startswith(SITE):
                self.problems.append(f"external <script src> at line {self.getpos()[0]}")
        for name, value in attrs:
            n = name.lower()
            if n.startswith("on"):
                self.problems.append(f"inline handler {n} on <{tag}> at line {self.getpos()[0]}")
            if value and n in ("href", "src", "action", "formaction", "xlink:href"):
                if value.strip().lower().startswith("javascript:"):
                    self.problems.append(f"javascript: URL on <{tag}> at line {self.getpos()[0]}")
                self.links.append((tag, n, value))
        if "id" in a and a["id"]:
            self.ids.add(a["id"])
        if tag in CHECK_BALANCE and tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        tag = tag.lower()
        self.handle_starttag(tag, attrs)
        if tag in CHECK_BALANCE and self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_script:
            self.in_script = False
            if self.script_text.strip():
                self.inline_scripts.append(self.script_text)
        if tag in CHECK_BALANCE:
            if tag in self.stack:
                while self.stack:
                    t = self.stack.pop()
                    if t == tag:
                        break
                    self.problems.append(f"unclosed <{t}> before </{tag}> at line {self.getpos()[0]}")
            else:
                self.problems.append(f"stray </{tag}> at line {self.getpos()[0]}")

    def handle_data(self, data):
        if self.in_title:
            self.title_text += data
        if self.in_script:
            self.script_text += data


def resolve(base: Path, root: Path, value: str) -> Path | None:
    """Return the local file a URL points to, or None if external / not a file."""
    v = value.strip()
    parts = urlsplit(v)
    if parts.scheme in ("mailto", "tel"):
        return None
    if parts.scheme or parts.netloc:
        if v.startswith(SITE + "/") or v == SITE:
            path = parts.path or "/"
        else:
            return None
    else:
        path = parts.path
        if not path:
            return base  # fragment-only
    if path in REDIRECTS:
        return root / "_redirects"
    path = unquote(path)
    if path.startswith("/"):
        target = root / path.lstrip("/")
    else:
        target = (base.parent / path)
    try:
        target = target.resolve()
        root_r = root.resolve()
        if root_r not in target.parents and target != root_r:
            return Path("/__outside__")
    except OSError:
        return Path("/__outside__")
    # Astro `build.format: 'file'` + trailingSlash never: /docs is served from docs.html
    # (even when a docs/ directory exists next to it).
    if target.suffix == "" and target.with_suffix(".html").is_file():
        return target.with_suffix(".html")
    if target.is_dir():
        target = target / "index.html"
    return target


def ids_in(path: Path, cache: dict[Path, set[str]]) -> set[str]:
    if path in cache:
        return cache[path]
    p = Page()
    try:
        p.feed(path.read_text(encoding="utf-8"))
    except Exception:
        cache[path] = set()
        return cache[path]
    cache[path] = p.ids
    return p.ids


def main(argv: list[str]) -> int:
    root = Path(argv[1] if len(argv) > 1 else "public")
    if not root.is_dir():
        print(f"{root}: not a directory")
        return 2
    cache: dict[Path, set[str]] = {}
    # Inline scripts are allowed only when dist/_headers carries their CSP hash
    # (scripts/gen-headers.mjs writes them). Without _headers, none is allowed.
    headers_txt = (root / "_headers").read_text(encoding="utf-8") if (root / "_headers").is_file() else ""
    pages = sorted(root.rglob("*.html"))
    links_checked = 0
    for page in pages:
        rel = page.relative_to(root).as_posix()
        p = Page()
        try:
            p.feed(page.read_text(encoding="utf-8"))
            p.close()
        except Exception as e:  # pragma: no cover
            finding(f"{rel}: parse error {e}")
            continue
        for prob in p.problems:
            finding(f"{rel}: {prob}")
        for js in p.inline_scripts:
            h = "sha256-" + base64.b64encode(hashlib.sha256(js.encode("utf-8")).digest()).decode()
            if h not in headers_txt:
                finding(f"{rel}: inline <script> not covered by a CSP hash in _headers")
        if p.stack:
            finding(f"{rel}: unclosed tags at end of file: {' '.join(p.stack)}")
        if not p.title or not p.title_text.strip():
            finding(f"{rel}: no <title>")
        if not p.lang:
            finding(f"{rel}: <html> has no lang")
        if not p.charset:
            finding(f"{rel}: no charset meta")
        for tag, attr, value in p.links:
            parts = urlsplit(value.strip())
            external = bool(parts.scheme or parts.netloc) and not value.strip().startswith(SITE)
            if external:
                if tag in RESOURCE_TAGS and attr == RESOURCE_TAGS[tag]:
                    finding(f"{rel}: external resource <{tag} {attr}={value}>")
                elif parts.scheme == "http":
                    finding(f"{rel}: insecure link {value}")
                continue
            target = resolve(page, root, value)
            if target is None:
                continue
            links_checked += 1
            if target == Path("/__outside__"):
                finding(f"{rel}: link escapes the site root: {value}")
                continue
            if not target.is_file():
                finding(f"{rel}: broken internal link {value} -> {target.relative_to(root.resolve()) if root.resolve() in target.parents else target}")
                continue
            if parts.fragment and target.suffix == ".html":
                if parts.fragment not in ids_in(target, cache):
                    finding(f"{rel}: fragment #{parts.fragment} not found in {value}")
    sm = root / "sitemap.xml"
    if sm.is_file():
        for loc in re.findall(r"<loc>(.*?)</loc>", sm.read_text(encoding="utf-8")):
            loc = loc.replace("&amp;", "&")
            if not loc.startswith(SITE):
                finding(f"sitemap.xml: loc not on {SITE}: {loc}")
                continue
            target = resolve(sm, root, loc)
            if target is None or not target.is_file():
                finding(f"sitemap.xml: {loc} does not resolve")
    else:
        finding("sitemap.xml: missing")
    print(f"checked {len(pages)} page(s), {links_checked} internal link(s)")
    if findings:
        print(f"{len(findings)} finding(s)")
        return 1
    print("no findings")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
