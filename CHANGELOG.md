# Changelog

## 0.2.0 — 2026-10-21

Deployment kit merged into the production site (agent-authored; reviewed by the founder before push).

- Documentation pages: `tools/build.py` renders the protocol documents (en and es) into `public/docs/`; `/docs` links them.
- Codex page (`/codex`, entry 0001, draft until the tag is pushed) and the extension URI page (`/ext/a2a/v1`).
- Lighthouse files reconciled: `llms.txt` and `.well-known/ilorium.json` carry the document URLs and every planned marking; `security.txt` gains `Policy:`.
- Deploy workflow to Cloudflare Pages (founder-gated environment), CI with the document build and the Python checks, security-agent-review caller, Dependabot for pip, `.github/CODEOWNERS`, actions pinned to commit SHAs.
- `verify-dist` scopes the third-party-URL and banned-word rules under `dist/docs/` (rendered documents cite sources and quote the words they ban).
- `og.png` rendered with the self-hosted fonts. Licenses (`LICENSE`, `LICENSE-SPECS`, `NOTICE`), `DNS.md`, `wrangler.toml`.

## 0.1.0 — 2026-10-21

First production build of ilorium.com, ported from the approved home prototype v4.

- Astro static site with React islands and framer-motion. No server, no tracking, no third-party requests.
- Pages: Home, Protocol, Radiant, Organism Zero (honest empty state), Documents, 404.
- Self-hosted fonts (Fraunces, IBM Plex Sans, IBM Plex Mono).
- Strict CSP with SHA-256 hashes computed at build time; security headers in `public/_headers`.
- The Lighthouse files: `/llms.txt`, `/.well-known/security.txt`, `/.well-known/ilorium.json`. Agent Card, MCP server and `ilorium init` are marked planned.
- Locks section now has exactly one Ember point (the closed birth gate).
- `PUBLIC_REPO_LIVE` flag keeps GitHub and document links as "soon" until the repository exists.
- Build gate `scripts/verify-dist.mjs`; CI workflow; Dependabot.
