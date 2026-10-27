# ilorium.com — site

Production code for **ilorium.com**, ported from the approved home prototype v4 (brand identity v1 is the visual law).
Static output only: a folder of files, no server, no tracking, nothing loaded from a third party.

- **Stack:** Astro 5 (static) · React 19 islands · framer-motion 12 · self-hosted fonts (`@fontsource`)
- **Node:** 22 (`.nvmrc`). Text on the site is US English.
- **License:** code Apache-2.0 (`LICENSE`), text CC BY 4.0 (`LICENSE-SPECS`), attribution in `NOTICE`. The license texts are the ones in the `protocol` repository (the M0 bundle had not arrived when this repository was assembled; the texts are identical to the protocol repo's).

## Commands

```sh
npm ci            # install from the lockfile
npm run dev       # dev server (http://localhost:4321)
npm run check     # astro check (types)
npm run build     # astro build  →  gen-headers  →  verify-dist   (fails the build if a rule is broken)
npm run preview   # serve dist/ locally (note: does NOT apply dist/_headers, so CSP is not enforced in preview)
```

## What the build produces and enforces

`npm run build` runs three steps:

1. `astro build` → `dist/`
2. `scripts/gen-headers.mjs` computes SHA-256 hashes of every inline `<script>` / `<style>` Astro emitted (3 scripts, 1 style: Astro's island bootstrap) and writes them into `dist/_headers`, replacing `{{SCRIPT_HASHES}}` and `{{STYLE_HASHES}}`.
3. `scripts/verify-dist.mjs` is the gate. It fails the build if:
   - a required file is missing (pages, `llms.txt`, `security.txt`, `ilorium.json`, `_headers`, example bundle, fonts…);
   - any HTML/CSS/JS contains a third-party URL, or a tracking/analytics pattern;
   - visible text contains a banned claim (`certified`, `trusted`, `approved`, `verified badge`): Ilorium issues no certifications, seals or rankings;
   - any file an agent may read contains zero-width or bidi control characters (hidden-text risk; the Lighthouse rule is "an agent reads exactly what a human reads");
   - an inline script or style is not covered by a CSP hash, or `_headers` still has unfilled placeholders;
   - a page lacks `<title>` or a meta description; the example JSON files are invalid.

### Security headers (`public/_headers`, Cloudflare Pages / Netlify syntax)

```
Content-Security-Policy: default-src 'none'; script-src 'self' <3 hashes>; style-src 'self' <1 hash>;
  style-src-attr 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self';
  base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff · X-Frame-Options: DENY · Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: (camera, microphone, geolocation, payment, usb… all off) · COOP/CORP: same-origin
```

Notes for whoever reviews the CSP:

- **No `'unsafe-inline'` for scripts or style elements.** Hashes are generated per build. `style-src-attr 'unsafe-inline'` is needed only because server-rendered `style="…"` attributes exist (progress bars, positions); it cannot execute code.
- Fonts are served from `/_astro/` (same origin). Nothing from Google Fonts.
- If a host does not support `_headers` (GitHub Pages), set the same headers at the CDN/edge. GitHub Pages cannot send them; prefer Cloudflare Pages.
- The dev/preview servers do not apply `_headers`. To test with CSP enforced, serve `dist/` with any static server that applies the `/*` block (the QA used a 20-line Node server that did exactly that: zero CSP violations on every page).

## Where things are

```
public/                static files, copied as-is
  _headers             security headers (template; hashes filled at build)
  boot.js              blocking same-origin script: saved theme before first paint + reveal-on-scroll (no inline JS)
  llms.txt             Lighthouse #1 (draft)
  .well-known/security.txt      RFC 9116 (Expires 2027-10-21: renew!)
  .well-known/ilorium.json      protocol descriptor (draft; documents have url: null until the repo is live)
  examples/*.example.json       the downloadable example Evidence Bundle (clearly marked example)
  favicon.svg, og.png, robots.txt, sitemap.xml
src/
  layouts/Base.astro   head, meta, OG, fonts, symbol sprite, nav, footer
  pages/               index, protocol, radiant, organisms/organism-zero, docs, 404
  components/*.astro   static sections (Hero, Metrics, Mission, Horizon, Band, Faq, Limits, Nav, Footer)
  components/*.tsx     React islands, hydrated on scroll (client:visible): CheckSection, VoiceHow, ProbeLive,
                       ProofGrid, Locks, RadiantNetwork, LighthouseList; ThemeToggle (client:load)
  data/                all content and sample data in one place (content.ts), symbol geometry
  lib/                 useTick (slow clock), rng (family-resemblance glyphs), repo (PUBLIC_REPO_LIVE)
  styles/global.css    brand tokens (dark/light), components, motion
scripts/               gen-headers.mjs, verify-dist.mjs
tools/                 deployment kit (Python, stdlib + markdown): build.py, check_*.py (see below)
public/docs/           the protocol documents rendered by tools/build.py (committed for review; CI rebuilds)
public/docs-assets/, public/fonts/   stylesheet, symbol and woff2 files the rendered documents use (no inline style, no JS)
.github/               CI and deploy workflows, security-agent-review caller, Dependabot, CODEOWNERS
DNS.md, wrangler.toml  the DNS checklist and the Cloudflare Pages project
```

### How the animation works (and degrades)

- Every illustrative animation is driven by `useTick`. **Server render, no JS, `prefers-reduced-motion` and "not yet scrolled into view" all draw the complete, static state** (the `R` flag). Motion starts when a block scrolls into view and pauses when it leaves.
- Reveal-on-scroll (bars growing, network lines drawing) is pure CSS armed by `boot.js` adding `.js` to `<html>`; it is skipped under reduced motion, and a timeout makes sure nothing stays hidden.
- framer-motion is used where it earns its weight: the Probe feed (`AnimatePresence`, layout) and the Radiant pulse.
- Horizon dots use SVG `animateMotion` (works in production because the DOM is not re-rendered).

### Brand rules enforced in code

One Ember point per composition (the Locks island draws its only Ember on the closed birth gate, and in the static state rests on it); no seals, checks, shields, rankings or traffic-light colors; every sample value is labeled "example"; "not observed" is hatched at the same size as "observed"; the human origin appears in every frame; SI2SI appears only as horizon or as the founder's labeled conviction.

## Environment flag

`PUBLIC_REPO_LIVE` (default `false`, see `.env.example`). While `false`, GitHub and per-document links render as **"soon"** text and nothing points at a repository that may not exist. Set it to `true` (Cloudflare Pages → Variables, or the `PUBLIC_REPO_LIVE` repository variable for CI) once `github.com/ilorium-protocol` is public **and the specs are published there**. Before flipping it, confirm the targets in `src/lib/repo.ts` (`REPO_URL`, `SPECS_URL`) and the file paths in `DOCS` (`src/data/content.ts`).

## Deploying (Cloudflare Pages)

Deployment is done by `.github/workflows/deploy.yml`, not by a Cloudflare Git integration: on push to `main`, inside the GitHub environment `production` (founder-approved), it renders the documents, runs `npm run build` and uploads `dist/` with `cloudflare/wrangler-action` (`wrangler pages deploy dist --project-name ilorium-com`). `dist/_headers` is applied automatically by Cloudflare Pages. Custom domain ilorium.com (apex; redirect `www` → apex).

Before the first deployment the founder does, by hand:

1. Create the Pages project `ilorium-com` in the Cloudflare dashboard (Workers & Pages → Create → Pages → Direct upload; no Git integration, the workflow uploads). Production branch: `main`.
2. Attach the custom domains `ilorium.com` and `www.ilorium.com`.
3. Create an API token with the permission "Cloudflare Pages: Edit" scoped to the account.
4. In the GitHub repository, create the environment `production`, add himself as required reviewer, and set the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` on that environment (not at repository level).
5. The deploy workflow is off until you set the repository variable `DEPLOY_ENABLED=true` (after the Cloudflare Pages project and the environment secrets exist). Set the repository variables `PUBLIC_REPO_LIVE=true` once the `protocol` repository is public, and `PROTOCOL_REF=protocol/1.0.0-draft.1` once that tag exists (the documents are rendered from `main` until then).
6. Set the DNS records in `DNS.md`.
7. After the first deployment, run `python3 tools/check_headers.py https://ilorium.com` and keep the output; then submit the domain at hstspreload.org.

## Deployment kit additions

Added on top of the ported site; everything here is read-only tooling or configuration. None of it changes what a visitor sees except the rendered documents, the Codex and the extension page.

- **Documentation pages.** `tools/build.py --protocol <checkout of ilorium-protocol/protocol> --public public --ref main` renders every Markdown document (English and `.es.md`) to `public/docs/<path>.html` with a plain template: no JavaScript, no inline style, stylesheet at `/docs-assets/site.css`, fonts at `/fonts/` (the same woff2 files Fontsource ships). Raw HTML in the documents goes through an allowlist sanitizer. `src/pages/docs.astro` is the index: it links a document when its page exists under `public/docs/` and shows "soon" otherwise. `public/docs/` is committed so the output can be reviewed; CI and the deploy regenerate it from the protocol repository (`vars.PROTOCOL_REF`, default `main`), so what is committed is not what is deployed. Dependency: `markdown==3.9`, pinned with its hash in `tools/requirements.txt` (`pip install --require-hashes -r tools/requirements.txt`).
- **`scripts/verify-dist.mjs` and the rendered documents.** The gate applies two rules differently under `dist/docs/`: a third-party URL is allowed inside an `<a href>` (the documents cite sources) but never as a resource, and the banned-word rule is not applied (the documents contain the words in negations and in the rule that bans them). Everything else (hidden characters, tracking patterns, hashes, external resources) applies unchanged.
- **Checks** (`tools/`, Python 3.11+, stdlib): `check_lighthouse.py` (ilorium.json is strict JSON, every URL https and resolving, every planned object without a URL; llms.txt and security.txt without hidden characters), `check_agent_readable.py <dir>` (hidden-instruction scan of everything an agent reads), `check_site.py dist` (internal links incl. fragments, HTML sanity, no external resources, inline scripts only with a CSP hash in `_headers`), `check_headers.py <origin>` (response headers of the deployed origin; a local server does not send them).
- **Workflows.** `ci.yml` (job `build`, a required status check): protocol docs checkout → `build.py` → Lighthouse and agent-readable checks → `npm ci`, `npm run check`, `npm run build` → `check_site.py dist` → artifact. `deploy.yml`: the same, then Cloudflare Pages, on push to `main` only, environment `production`. `security-agent-review.yml`: caller of the reusable workflow in `ilorium-protocol/.github` (the agent is AI; it comments, never approves; its model review is planned until a key is configured). All third-party actions pinned to full commit SHAs; Dependabot (npm, pip, GitHub Actions) proposes updates weekly.
- **Codex.** `src/pages/codex.astro`: the chronicle of the species by cause. Entry 0001 (the protocol published as a draft) is itself a draft until the founder pushes the tag. Linked from the footer and the Documents page; not in the main nav.
- **Extension URI.** `src/pages/ext/a2a/v1.astro`: `https://ilorium.com/ext/a2a/v1` resolves to a description page (data-only extension, draft, not an endpoint).
- **`DNS.md`**: the records the founder sets in Cloudflare, as a checklist with observed / not yet. **`wrangler.toml`**: the Pages project.
- **CODEOWNERS** (`.github/CODEOWNERS`): every path → `@fseldon` during interim governance; the protected entries move to `@ilorium-protocol/genome-custodians` when two Custodians are in office.
- **Licenses**: `LICENSE` (Apache-2.0) and `LICENSE-SPECS` (CC BY 4.0) are the texts from the `protocol` repository; `NOTICE` names the fonts and the rendered documents. The fonts under `public/fonts/` are the same OFL files as the Fontsource packages (`public/fonts/LICENSE`).
- **`og.png`** was regenerated at 1200×630 with the self-hosted Fraunces and IBM Plex Mono (symbol, wordmark, tagline on Detector night).

## Mapping to the deployment brief (section 2)

| Brief item | State |
| --- | --- |
| Static hosting from the `site` repo, deployed by CI | Ready: CI builds and verifies; connect Cloudflare Pages to the repo |
| HSTS preload, strict CSP, nosniff, Referrer-Policy, Permissions-Policy | Done in `public/_headers`. After the first deploy, submit the domain at hstspreload.org (requires `includeSubDomains` on every subdomain) |
| Fonts from our own domain | Done (fontsource, same origin) |
| DNS: DNSSEC, CAA, DMARC `p=quarantine`/`reject` | **Not in this repo.** Do at the registrar/DNS provider and Workspace |
| `/llms.txt` | Done (draft) |
| `/.well-known/security.txt` (RFC 9116) | Done, with `Policy:` → `protocol/SECURITY.md` and the GitHub private-advisory contact; renew `Expires` yearly (2027-10-21) |
| `/.well-known/ilorium.json` | Done (draft). `documents[]` carry `html` (ilorium.com/docs) and `source` (GitHub at main); `schemas`, `vectors`, `verifier`, `indexes`, Agent Card, MCP, CLI, witnesses, donations are `planned` |
| Agent Card at `/.well-known/agent-card.json` | **Only when an agent that answers exists.** Marked `planned` everywhere |
| MCP server, `ilorium init` | Marked `planned` |
| No visitor tracking, no third-party analytics | Enforced by `verify-dist` and CSP. No cookies are set |
| Home: locks section with exactly one Ember | Done (closed birth gate) |
| Documentation pages generated from `protocol` | Built: `tools/build.py` renders them into `public/docs/` (CI from the `protocol` repo); `/docs` links each one and says "soon" only where no page exists |
| CODEOWNERS | Done: `.github/CODEOWNERS`, every path → the founder (interim) |
| Deploy to Cloudflare Pages from CI, founder-gated | Done: `deploy.yml`, environment `production`, secrets on the environment |

## Known limitations and open items

1. **OG image (`public/og.png`)** is rendered with the self-hosted Fraunces and Plex Mono (1200×630). The founder's earlier version used fallback fonts; the composition is similar (symbol right, text left).
2. **Wordmark.** The nav and footer use the small-cut symbol (inline sprite, `currentColor`) plus the word "ilorium" set in Fraunces. The official horizontal lockups (`ilorium/brand/ilorium-lockup-horizontal*.svg` in the Project) are not embedded; drop them in `public/brand/` if the exact drawn wordmark is wanted in the nav.
3. **Identity kit section** (icons, colors, type specimen) was dropped from the home in prototype v3 to shorten the page and has not been restored. It can live on a `/brand` page.
4. **Dependency audit.** `npm audit` reports 3 findings, all inside Astro 5's toolchain (Astro `define:vars` XSS, server-island parameters, spread-prop attribute names; `esbuild` dev server on Windows; `sharp`). None is reachable here: this is a static build that uses none of those features and processes no untrusted input, and `sharp` is not used (no `<Image>`). `npm audit` is **0** on Astro 7, which needs Node ≥ 22.23.4; this was verified at install time but **the build was not run on Astro 7** (the build environment had Node 22.22). To upgrade: `npm i astro@latest @astrojs/react@latest && npm run build`, then check the pages. Dependabot is configured and will propose it.
5. `/docs` links and GitHub links are "soon" by design until `PUBLIC_REPO_LIVE=true`.
6. The Radiant/Probe/Proof of Life figures are **simulated examples** and are labeled as such on screen. The only real organism on the site is Organism Zero, shown with its true current state: in gestation, 0 beats, everything not observed, verdict UNKNOWN. Update `src/pages/organisms/organism-zero.astro` when the Probe records its first beat, and not before.
7. No Spanish version of the site pages (US English). The rendered documents under `/docs/` include the `.es.md` working translations with an en/es switch.
8. `.github/CODEOWNERS` is in place (every path → the founder during interim governance). Files an agent may read (`llms.txt`, `.well-known/*`, `_headers`, `examples/`, `scripts/`, `tools/`) are listed explicitly so they move to the Custodians' team when it exists; the security agent reviews every pull request.

## Contributing

Community rules (`CONTRIBUTING.md`, `GOVERNANCE.md`, DCO, signed commits, IIP process) live in the `protocol` repository and the organization's `.github` repository. Changes here follow them. Agent-authored changes carry their own identity and the `agent-authored` label.
