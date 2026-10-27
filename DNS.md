# DNS for ilorium.com

Records the founder sets in Cloudflare DNS. Nothing here is set by an agent; nothing here is set yet. Every item has an "observed" line; the security agent's weekly audit fills it in once it runs, and the founder can check by hand with `dig`.

Legend: `[ ]` not yet · `[x]` observed.

## Site (Cloudflare Pages)

The Pages project is `ilorium-com` (wrangler.toml). Cloudflare attaches the custom domains in the Pages project settings and creates the CNAMEs itself when the zone is on Cloudflare; check that they exist.

| | Type | Name | Content | Proxy | Notes |
| --- | --- | --- | --- | --- | --- |
| [ ] | CNAME | `ilorium.com` (apex) | `ilorium-com.pages.dev` | proxied | Cloudflare flattens the apex CNAME |
| [ ] | CNAME | `www` | `ilorium-com.pages.dev` | proxied | Pages redirects www to the apex when both are custom domains; otherwise add a Bulk Redirect |

Observed: not yet.

Also in the Pages project: `main` is the production branch; preview deployments for other branches may stay on (they are on `*.ilorium-com.pages.dev`, not on the domain).

## DNSSEC

| | What | Where |
| --- | --- | --- |
| [ ] | DNSSEC enabled on the zone | Cloudflare DNS → Settings → DNSSEC |
| [ ] | DS record published at the registrar | registrar control panel; Cloudflare shows the DS values |

Check: `dig +dnssec ilorium.com SOA` shows an RRSIG; `dig ilorium.com DS @1.1.1.1` returns a record.

Observed: not yet.

## CAA

Cloudflare Pages issues certificates through Google Trust Services and Let's Encrypt (the backup CA may change; Cloudflare lists the CAs it uses). Both are allowed. No wildcard issuance. Violations are reported to security@.

| | Type | Name | Content |
| --- | --- | --- | --- |
| [ ] | CAA | `ilorium.com` | `0 issue "letsencrypt.org"` |
| [ ] | CAA | `ilorium.com` | `0 issue "pki.goog"` |
| [ ] | CAA | `ilorium.com` | `0 issuewild ";"` |
| [ ] | CAA | `ilorium.com` | `0 iodef "mailto:security@ilorium.com"` |

If a Cloudflare-managed certificate fails to issue after CAA is set, Cloudflare's docs list the additional CAs it may use for Universal SSL (for example `digicert.com`, `sectigo.com` in older plans); add only what the error names.

Check: `dig ilorium.com CAA`.

Observed: not yet.

## Mail (Google Workspace)

Mailboxes and groups: hello@, security@, press@, agents@, conduct@, security-agent@ (and dmarc@ for reports).

| | Type | Name | Priority | Content |
| --- | --- | --- | --- | --- |
| [ ] | MX | `ilorium.com` | 1 | `smtp.google.com` |
| [ ] | TXT | `ilorium.com` | | `v=spf1 include:_spf.google.com -all` |
| [ ] | TXT | `google._domainkey` | | DKIM key from Google Admin → Apps → Google Workspace → Gmail → Authenticate email (2048-bit) |
| [ ] | TXT | `_dmarc` | | `v=DMARC1; p=quarantine; rua=mailto:dmarc@ilorium.com; pct=100; adkim=s; aspf=s` |

Notes:

- Google Workspace domain verification: Google gives a TXT record (`google-site-verification=…`) during setup; add it at the apex.
- DMARC starts at `p=quarantine`. Move to `p=reject` after two weeks of clean aggregate reports at dmarc@ (no legitimate source failing alignment).
- Strict alignment (`adkim=s; aspf=s`) means only mail sent through Workspace with DKIM for `ilorium.com` passes. Any other sender (a form, a transactional service) must be added to SPF and sign with DKIM for the domain, or it will be quarantined.
- The mailboxes are not an agent's. The security agent's mailbox triage is planned and runs only when the founder configures a service account (see the `.github` repo).

Check: `dig ilorium.com MX`, `dig ilorium.com TXT`, `dig _dmarc.ilorium.com TXT`, `dig google._domainkey.ilorium.com TXT`.

Observed: not yet.

## GitHub organization domain verification

Verifying the domain lets the organization show a "Verified" badge and restricts notification email domains.

| | Type | Name | Content |
| --- | --- | --- | --- |
| [ ] | TXT | `_github-challenge-ilorium-protocol` | value shown by GitHub at Organization settings → Verified and approved domains → Add domain |

GitHub shows the exact host name and value; copy them as given. The record can be removed after verification, but keeping it is harmless.

Observed: not yet.

## Not set, on purpose

- No `A`/`AAAA` records pointing at other hosting. The site is only on Pages.
- No wildcard records.
- No records for an index, an MCP server or an Agent Card host: those are planned, not deployed.
- No third-party verification TXT records except the ones above.

## How the audit reads this

The security agent's weekly audit (`.github` repo, `security-agent/audit.py`) runs `dig` for DNSSEC, CAA, MX, SPF and DMARC and reports "observed" or "not observed" for each. It never changes DNS. Changes to DNS are made by the founder in the Cloudflare dashboard.
