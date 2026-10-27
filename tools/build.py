#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright The Ilorium Authors
"""Render the Ilorium protocol documents to public/docs/ and write sitemap.xml.

Usage:
    python3 tools/build.py --protocol DIR [--public public] [--site https://ilorium.com]

DIR is a checkout of the protocol repository (or the exported documents).
Every Markdown file under DIR, except the ones listed in SKIP, is rendered to
public/docs/<same path>.html. English and Spanish (.es.md) files are both
rendered. The index of documents is the Astro page src/pages/docs.astro; this
script writes no index.html (pass --index to get one, for a standalone use).

The pages contain no JavaScript and make no external request. Raw HTML in
the Markdown is rendered by the `markdown` package and then passed through an
allowlist sanitizer; anything not in the allowlist is dropped.

When DIR does not exist or holds no Markdown, the build still writes an index
page with a notice, so the site deploys from an empty input.

Dependencies: markdown (pinned in tools/requirements.txt). Everything else is
the standard library.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import html
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

try:
    import markdown  # type: ignore
except ImportError:  # pragma: no cover
    sys.stderr.write("tools/build.py: the `markdown` package is missing. "
                     "Install it with: pip install -r tools/requirements.txt\n")
    sys.exit(2)

SITE = "https://ilorium.com"
REPO = "https://github.com/ilorium-protocol/protocol"
REPO_REF = "main"  # overridden by --ref; the tag once it exists
TODAY = _dt.date.today().isoformat()

# Files that are not documents (not rendered).
SKIP_NAMES = {"LICENSE", "LICENSE-SPECS", "NOTICE", "AUTHORS", "CODEOWNERS",
              "CODE_OF_CONDUCT.md", "CONTRIBUTING.md", "SECURITY.md",
              "GOVERNANCE.md", "PULL_REQUEST_TEMPLATE.md", "TEMPLATE.md"}
SKIP_DIRS = {".git", ".github", "schemas", "vectors", "verifier", "tools",
             "docs", "node_modules", "iips", "governance"}

# Order of the docs index: taken from manifest.md when present, otherwise this.
FALLBACK_ORDER = [
    "README.md", "whitepaper-v1.md", "manifest.md", "genome/genome-v1.md",
    "governance-v1.md", "specs/pulse-v1.md", "specs/evidence-format-v1.md",
    "specs/probe-v1.md", "specs/proof-of-life-v1.md", "specs/ecosystem-v1.md",
    "specs/discovery-and-growth-v1.md", "glossary.md",
    "engineering/architecture-v1.md", "research/related-projects.md",
    "brand/brand-identity-v1.md", "CHANGELOG.md",
]

# ---------------------------------------------------------------------------
# Sanitizer: allowlist of tags and attributes. Everything else is dropped.
# ---------------------------------------------------------------------------

ALLOWED_TAGS = {
    "a", "abbr", "b", "blockquote", "br", "code", "dd", "del", "dl", "dt",
    "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd",
    "li", "ol", "p", "pre", "s", "samp", "small", "span", "strong", "sub",
    "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul", "div",
    "details", "summary", "figure", "figcaption", "caption", "cite", "q", "var",
}
VOID_TAGS = {"br", "hr", "img"}
# Tags whose whole content is dropped, not just the tag.
DROP_CONTENT_TAGS = {"script", "style", "iframe", "object", "embed", "noscript",
                     "template", "svg", "math", "form", "input", "button",
                     "textarea", "select", "link", "meta", "base", "applet",
                     "frame", "frameset", "canvas", "audio", "video"}
ALLOWED_ATTRS = {
    "a": {"href", "title", "id"},
    "img": {"src", "alt", "title", "width", "height"},
    "abbr": {"title"},
    "td": {"colspan", "rowspan", "align"},
    "th": {"colspan", "rowspan", "align"},
    "ol": {"start"},
    "li": {"id"},
    "details": {"open"},
    "*": {"id", "class"},
}
SAFE_URL_SCHEMES = ("https:", "http:", "mailto:")


def safe_url(value: str, *, img: bool = False) -> str | None:
    v = value.strip().replace("\n", "").replace("\r", "").replace("\t", "")
    low = v.lower()
    if low.startswith(("javascript:", "vbscript:", "data:", "file:")):
        return None
    if ":" in v.split("/")[0] and not low.startswith(SAFE_URL_SCHEMES):
        # some other scheme
        return None
    if img and not (low.startswith("https://") or v.startswith("/") or
                    not re.match(r"^[a-z][a-z0-9+.-]*:", low)):
        return None
    return v


class Sanitizer(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self.drop_depth = 0
        self.stack: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        if self.drop_depth:
            if tag in DROP_CONTENT_TAGS and tag not in VOID_TAGS:
                self.drop_depth += 1
            return
        if tag in DROP_CONTENT_TAGS:
            self.drop_depth = 1
            return
        if tag not in ALLOWED_TAGS:
            return  # drop the tag, keep its content
        kept = []
        allowed = ALLOWED_ATTRS.get(tag, set()) | ALLOWED_ATTRS["*"]
        for name, value in attrs:
            name = name.lower()
            if name.startswith("on") or name not in allowed or value is None:
                continue
            if name in ("href", "src"):
                value = safe_url(value, img=(name == "src"))
                if value is None:
                    continue
            if name == "class":
                value = " ".join(c for c in value.split() if re.fullmatch(r"[A-Za-z0-9_-]+", c))
                if not value:
                    continue
            kept.append(f' {name}="{html.escape(value, quote=True)}"')
        self.out.append(f"<{tag}{''.join(kept)}>")
        if tag not in VOID_TAGS:
            self.stack.append(tag)

    def handle_startendtag(self, tag: str, attrs) -> None:
        self.handle_starttag(tag, attrs)
        tag = tag.lower()
        if tag in ALLOWED_TAGS and tag not in VOID_TAGS and not self.drop_depth:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self.drop_depth:
            if tag in DROP_CONTENT_TAGS:
                self.drop_depth -= 1
            return
        if tag in ALLOWED_TAGS and tag not in VOID_TAGS and tag in self.stack:
            # close up to the matching tag
            while self.stack:
                t = self.stack.pop()
                self.out.append(f"</{t}>")
                if t == tag:
                    break

    def handle_data(self, data: str) -> None:
        if not self.drop_depth:
            self.out.append(html.escape(data, quote=False))

    def handle_comment(self, data: str) -> None:
        pass  # comments are dropped

    def handle_decl(self, decl: str) -> None:
        pass

    def handle_pi(self, data: str) -> None:
        pass

    def close(self) -> str:  # type: ignore[override]
        super().close()
        while self.stack:
            self.out.append(f"</{self.stack.pop()}>")
        return "".join(self.out)


def sanitize(fragment: str) -> str:
    s = Sanitizer()
    s.feed(fragment)
    return s.close()


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

TEMPLATE = """<!DOCTYPE html>
<!-- SPDX-License-Identifier: CC-BY-4.0 (text) / Apache-2.0 (markup). Copyright The Ilorium Authors.
     Generated by tools/build.py from {src_path} in the protocol repository. No JavaScript. No external requests. -->
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Ilorium</title>
<meta name="description" content="{description}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/docs-assets/site.css">
<link rel="canonical" href="{canonical}">
{alternate}
</head>
<body>
<div class="banner"><div class="wrap"><span>Ilorium protocol · release 1.0 · draft · interim governance</span><span>No organism is running.</span></div></div>
<nav class="top"><div class="wrap">
<a class="mark" href="/"><img src="/docs-assets/symbol-small.svg" alt="" width="28" height="28">Ilorium</a>
<ul>
<li><a href="/">Home</a></li>
<li><a href="/docs">Documents</a></li>
<li><a href="/codex">Codex</a></li>
<li><a href="{repo}">Repository</a></li>
<li><a href="/llms.txt">llms.txt</a></li>
</ul>
</div></nav>
<main><div class="wrap">
<p class="meta">{src_path} · <a href="{source_url}">source on GitHub</a>{lang_switch}</p>
{body}
</div></main>
<footer><div class="wrap">
<span>CC BY 4.0 · The Ilorium Authors</span>
<span>Draft. Not a seal, not a score, not a ranking.</span>
<a href="/.well-known/security.txt">security.txt</a>
<a href="/llms.txt">llms.txt</a>
</div></footer>
</body>
</html>
"""


def first_heading(md_text: str, fallback: str) -> str:
    for line in md_text.splitlines():
        m = re.match(r"^#\s+(.+?)\s*#*\s*$", line)
        if m:
            return re.sub(r"[*_`]", "", m.group(1)).strip()
    return fallback


def first_paragraph(md_text: str) -> str:
    buf: list[str] = []
    for line in md_text.splitlines():
        s = line.strip()
        if not s or s.startswith(("#", "|", "```", "-", "*", ">", "<")):
            if buf:
                break
            continue
        buf.append(s)
    text = " ".join(buf)
    text = re.sub(r"[*_`\[\]]", "", text)
    text = re.sub(r"\(https?://[^)]*\)", "", text)
    return text[:200].strip()


def rewrite_links(fragment: str, rel_dir: str) -> str:
    """Turn relative links to .md files into links to the rendered .html."""
    def fix(m: re.Match) -> str:
        href = m.group(2)
        if re.match(r"^[a-z][a-z0-9+.-]*:", href, re.I) or href.startswith(("/", "#")):
            return m.group(0)
        path, _, frag = href.partition("#")
        if path.endswith(".md"):
            path = path[:-3] + ".html"
        return f'{m.group(1)}{path}{"#" + frag if frag else ""}"'
    return re.sub(r'(<a [^>]*href=")([^"]+)"', fix, fragment)


def render_markdown(md_text: str) -> str:
    md = markdown.Markdown(extensions=["tables", "fenced_code", "toc", "sane_lists"],
                           extension_configs={"toc": {"permalink": False}},
                           output_format="html5")
    return md.convert(md_text)


def html_lang_for(path: str) -> str:
    return "es" if path.endswith(".es.md") else "en"


def counterpart(path: str) -> str:
    if path.endswith(".es.md"):
        return path[:-6] + ".md"
    return path[:-3] + ".es.md"


def render_doc(src: Path, rel: str, public: Path, site: str, ref: str, existing: set[str]) -> str:
    text = src.read_text(encoding="utf-8")
    lang = html_lang_for(rel)
    title = first_heading(text, Path(rel).stem)
    description = first_paragraph(text) or f"Ilorium protocol document {rel}. Draft."
    body = sanitize(rewrite_links(render_markdown(text), str(Path(rel).parent)))
    out_rel = rel[:-3] + ".html"
    canonical = f"{site}/docs/{out_rel}"
    other = counterpart(rel)
    alternate = ""
    lang_switch = ""
    if other in existing:
        other_html = other[:-3] + ".html"
        other_lang = html_lang_for(other)
        alternate = (f'<link rel="alternate" hreflang="{other_lang}" href="{site}/docs/{other_html}">\n'
                     f'<link rel="alternate" hreflang="{lang}" href="{canonical}">')
        label = "Versión en español" if other_lang == "es" else "English version"
        lang_switch = f' · <a href="/docs/{other_html}" hreflang="{other_lang}">{label}</a>'
    if lang == "es":
        lang_switch += " · Traducción de trabajo; si difiere, prevalece la versión en inglés."
    page = TEMPLATE.format(
        lang=lang, title=html.escape(title), description=html.escape(description, quote=True),
        canonical=canonical, alternate=alternate, repo=REPO,
        src_path=html.escape(rel), source_url=f"{REPO}/blob/{ref}/{rel}",
        lang_switch=lang_switch, body=body,
    )
    dest = public / "docs" / out_rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(page, encoding="utf-8")
    return out_rel


def manifest_order(protocol: Path) -> list[str]:
    """README, whitepaper, manifest first; then the release table of manifest.md
    (the protocol documents, in its order); then the rest; CHANGELOG last."""
    head = ["README.md", "whitepaper-v1.md", "manifest.md"]
    tail = ["engineering/architecture-v1.md", "research/related-projects.md",
            "brand/brand-identity-v1.md", "CHANGELOG.md"]
    middle: list[str] = []
    m = protocol / "manifest.md"
    if m.exists():
        text = m.read_text(encoding="utf-8")
        # the release table: rows "| Component | `path.md` | version | layer |"
        for match in re.finditer(r"^\|[^|\n]*\|\s*`([A-Za-z0-9_./-]+\.md)`\s*\|", text, re.M):
            p = match.group(1)
            if p not in middle and p not in head and p not in tail and not p.endswith(".es.md"):
                middle.append(p)
    order = head + middle
    for p in FALLBACK_ORDER:
        if p not in order and p not in tail:
            order.append(p)
    return order + tail


def doc_title(protocol: Path, rel: str) -> str:
    p = protocol / rel
    if p.exists():
        return first_heading(p.read_text(encoding="utf-8"), rel)
    return rel


INDEX_TEMPLATE_BODY = """<h1>Documents</h1>
<p class="lede">The Ilorium protocol, release 1.0. Draft: formats may change, and no organism has demonstrated the protocol in operation. One version of each document is kept; changes are listed in the changelog.</p>
<p class="meta">Rendered from <a href="{repo}/tree/{ref}">{repo_short} at {ref}</a> on {today}. English is the official language; Spanish files are working translations.</p>
{list}
"""

EMPTY_NOTICE = """<div class="notice">No documents were available when this page was built. The protocol documents live at <a href="{repo}">{repo}</a>; this index is populated by the site build (tools/build.py) from a checkout of that repository.</div>"""


def write_index(public: Path, protocol: Path, rendered: list[str], site: str, ref: str) -> None:
    rendered_set = set(rendered)
    items: list[str] = []
    listed: set[str] = set()
    for rel in manifest_order(protocol):
        out_rel = rel[:-3] + ".html"
        if out_rel not in rendered_set:
            continue
        listed.add(out_rel)
        es = counterpart(rel)[:-3] + ".html"
        es_link = f'<a class="es" href="/docs/{es}" hreflang="es">es</a>' if es in rendered_set else ""
        if es in rendered_set:
            listed.add(es)
        items.append(f'<li><a href="/docs/{out_rel}">{html.escape(doc_title(protocol, rel))}</a>{es_link}'
                     f'<br><span class="path">{html.escape(rel)}</span></li>')
    # anything rendered but not in the manifest order (english only; es handled via counterpart)
    for out_rel in sorted(rendered_set - listed):
        if out_rel.endswith(".es.html"):
            en = out_rel[:-8] + ".html"
            if en in rendered_set:
                continue
        rel = out_rel[:-5] + ".md"
        es = counterpart(rel)[:-3] + ".html"
        es_link = f'<a class="es" href="/docs/{es}" hreflang="es">es</a>' if es in rendered_set and es != out_rel else ""
        items.append(f'<li><a href="/docs/{out_rel}">{html.escape(doc_title(protocol, rel))}</a>{es_link}'
                     f'<br><span class="path">{html.escape(rel)}</span></li>')
    if items:
        listing = '<ul class="doclist">\n' + "\n".join(items) + "\n</ul>"
    else:
        listing = EMPTY_NOTICE.format(repo=REPO)
    body = INDEX_TEMPLATE_BODY.format(repo=REPO, repo_short="ilorium-protocol/protocol", ref=html.escape(ref),
                                      today=TODAY, list=listing)
    page = TEMPLATE.format(
        lang="en", title="Documents", description="The Ilorium protocol documents, release 1.0, draft.",
        canonical=f"{site}/docs/", alternate="", repo=REPO, src_path="docs index",
        source_url=f"{REPO}/tree/{ref}", lang_switch="", body=body,
    )
    (public / "docs").mkdir(parents=True, exist_ok=True)
    (public / "docs" / "index.html").write_text(page, encoding="utf-8")


# The Astro pages (src/pages/*.astro), as Cloudflare Pages serves them (trailingSlash: never).
SITE_PAGES = ["", "protocol", "radiant", "organisms/organism-zero", "docs", "codex", "ext/a2a/v1"]


def write_sitemap(public: Path, site: str) -> None:
    urls: list[str] = [f"{site}/{p}" for p in SITE_PAGES]
    for p in sorted(public.rglob("*.html")):
        rel = p.relative_to(public).as_posix()
        if rel == "404.html":
            continue
        if rel.endswith("index.html"):
            rel = rel[: -len("index.html")]
        urls.append(f"{site}/{rel}")
    for extra in ("llms.txt", ".well-known/ilorium.json", ".well-known/security.txt"):
        if (public / extra).exists():
            urls.append(f"{site}/{extra}")
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        lines.append(f"  <url><loc>{html.escape(u)}</loc><lastmod>{TODAY}</lastmod></url>")
    lines.append("</urlset>")
    (public / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def collect(protocol: Path) -> list[str]:
    if not protocol.is_dir():
        return []
    found: list[str] = []
    for p in sorted(protocol.rglob("*.md")):
        rel = p.relative_to(protocol).as_posix()
        parts = rel.split("/")
        if any(part in SKIP_DIRS for part in parts[:-1]):
            continue
        if parts[-1] in SKIP_NAMES:
            continue
        found.append(rel)
    return found


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--protocol", default="_protocol", help="directory with the protocol documents")
    ap.add_argument("--public", default="public", help="site root to write into")
    ap.add_argument("--site", default=SITE, help="canonical site origin")
    ap.add_argument("--ref", default=REPO_REF, help="git ref of the protocol repo used for source links")
    ap.add_argument("--index", action="store_true",
                    help="also write public/docs/index.html (not used on ilorium.com: /docs is an Astro page)")
    args = ap.parse_args(argv)

    protocol = Path(args.protocol)
    public = Path(args.public)
    docs = public / "docs"
    docs.mkdir(parents=True, exist_ok=True)
    # Clean previous output (only .html under docs/).
    for old in docs.rglob("*.html"):
        old.unlink()

    rels = collect(protocol)
    existing = set(rels)
    rendered: list[str] = []
    for rel in rels:
        rendered.append(render_doc(protocol / rel, rel, public, args.site, args.ref, existing))
    if args.index:
        write_index(public, protocol, rendered, args.site, args.ref)
    write_sitemap(public, args.site)
    if rels:
        print(f"build: rendered {len(rendered)} documents from {protocol} into {docs}")
    else:
        print(f"build: no documents found in {protocol}; nothing rendered"
              + (" (empty index with a notice written)" if args.index else ""))
    print(f"build: wrote {public / 'sitemap.xml'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
