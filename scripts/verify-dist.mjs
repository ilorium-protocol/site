// Build gate. Fails the build if the output breaks a rule the site makes publicly.
//  1. Required files exist.
//  2. No third-party URLs in HTML/CSS/JS (the site loads nothing from outside its own origin).
//  3. No banned claims (the protocol issues no certification, seals or rankings).
//  4. Every inline <script>/<style> is covered by a hash in dist/_headers; no leftover placeholders.
//  5. No tracking/analytics identifiers.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';

const dist = new URL('../dist/', import.meta.url).pathname;
const errors = [];
const fail = (m) => errors.push(m);

const required = [
  'index.html', 'protocol.html', 'radiant.html', 'docs.html', 'codex.html', 'ext/a2a/v1.html', '404.html',
  'organisms/organism-zero.html',
  'llms.txt', 'robots.txt', 'sitemap.xml', 'favicon.svg', 'og.png', 'boot.js', '_headers',
  '.well-known/security.txt', '.well-known/ilorium.json',
  'examples/example-organism.evidence-bundle.example.json',
];
for (const f of required) if (!existsSync(join(dist, f))) fail(`missing required file: ${f}`);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = existsSync(dist) ? walk(dist) : [];
// dist/docs/ holds the protocol documents rendered verbatim by tools/build.py (CC BY 4.0 text the site
// does not edit). They cite outside sources as plain links and contain the words the site itself must
// not use, in negations and in the rule that bans them. For those pages: a third-party URL is allowed
// only inside an <a href>, never as a resource (link/img/script/style), and the banned-word rule is not
// applied. Hidden characters, tracking patterns, inline hashes and external resources are still checked.
const isDoc = (rel) => rel.startsWith('docs/');
const textExt = new Set(['.html', '.css', '.js', '.mjs', '.json', '.txt', '.xml', '.svg']);

// Hosts that may appear as plain text or XML namespaces. Nothing here is fetched.
const allowedHosts = [
  'ilorium.com', 'www.w3.org', 'github.com/ilorium-protocol', 'sitemaps.org', 'www.sitemaps.org',
  'react.dev', 'reactjs.org', 'github.com/facebook/react', // React's own error-message strings in the bundle
  'datatracker.ietf.org', 'a2a-protocol.org',
];
const bannedWords = [/\bcertified\b/i, /\btrusted\b/i, /\bapproved\b/i, /\bverified badge\b/i];
const tracking = [/googletagmanager/i, /google-analytics/i, /gtag\(/, /plausible\.io/i, /fathom/i, /posthog/i, /segment\.com/i, /hotjar/i, /mixpanel/i, /fbq\(/];

const hashes = (() => {
  try { return readFileSync(join(dist, '_headers'), 'utf8'); } catch { return ''; }
})();
if (/\{\{[A-Z_]+\}\}/.test(hashes)) fail('dist/_headers still has unfilled {{placeholders}} (run gen-headers).');

for (const f of files) {
  if (!textExt.has(extname(f))) continue;
  const rel = f.slice(dist.length);
  const txt = readFileSync(f, 'utf8');

  if (['.html', '.css'].includes(extname(f)) || rel.endsWith('.js')) {
    // In a rendered document, strip the <a href="..."> link targets before the scan (links are not loads).
    const scanTxt = isDoc(rel) && extname(f) === '.html' ? txt.replace(/<a\s[^>]*href="[^"]*"/g, '<a') : txt;
    for (const m of scanTxt.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(\/[^\s"'<>)`]*)?/gi)) {
      const hostPath = (m[1] + (m[2] || '')).toLowerCase();
      if (!allowedHosts.some((a) => hostPath === a || hostPath.startsWith(a + '/') || hostPath.startsWith(a))) {
        if (rel.endsWith('.js') && /^(reactjs\.org|react\.dev)/.test(hostPath)) continue;
        if (isDoc(rel) && extname(f) === '.html') {
          // Inside a tag? Only a resource-loading tag is a violation; a URL in visible text is a citation.
          const before = scanTxt.slice(0, m.index);
          const lt = before.lastIndexOf('<'), gt = before.lastIndexOf('>');
          const inTag = lt > gt;
          const tagName = inTag ? (before.slice(lt + 1).match(/^\/?([a-z0-9-]+)/i) || [])[1] : null;
          if (!inTag || !/^(link|img|script|style|source|iframe|object|embed|video|audio|track|use|image)$/i.test(tagName || '')) continue;
        }
        fail(`${rel}: third-party URL "${m[0]}"`);
      }
    }
    for (const t of tracking) if (t.test(txt)) fail(`${rel}: tracking pattern ${t}`);
  }

  // Agents read exactly what humans read: no invisible or direction-changing characters in anything an agent may parse.
  if (/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/.test(txt)) fail(`${rel}: zero-width or bidi control character (hidden-text risk)`);

  if (extname(f) === '.html') {
    const visible = txt.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
    for (const b of isDoc(rel) ? [] : bannedWords) {
      const m = visible.match(b);
      if (m) {
        const ctx = visible.slice(Math.max(0, m.index - 50), m.index + 60).replace(/\s+/g, ' ');
        // allowed in a negation ("not a certification" is fine; the words above are adjectives that claim status)
        fail(`${rel}: banned word "${m[0]}" … ${ctx}`);
      }
    }
    // inline scripts/styles must be hashed
    for (const m of txt.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/\bsrc\s*=/.test(m[1]) || !m[2].trim()) continue;
      if (/type\s*=\s*["'](?:application\/ld\+json|application\/json)/i.test(m[1])) continue;
      const hh = "sha256-" + createHash('sha256').update(m[2], 'utf8').digest('base64');
      if (!hashes.includes(hh)) fail(`${rel}: inline <script> not covered by CSP hash`);
    }
    for (const m of txt.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
      if (!m[1].trim()) continue;
      const hh = "sha256-" + createHash('sha256').update(m[1], 'utf8').digest('base64');
      if (!hashes.includes(hh)) fail(`${rel}: inline <style> not covered by CSP hash`);
    }
    if (/<script[^>]+src=["']https?:/i.test(txt)) fail(`${rel}: external script`);
    if (/<link[^>]+href=["']https?:\/\/(?!ilorium\.com)/i.test(txt)) fail(`${rel}: external stylesheet/link`);
    if (!/<title>[^<]+<\/title>/.test(txt)) fail(`${rel}: missing <title>`);
    if (!/<meta name="description"/.test(txt)) fail(`${rel}: missing meta description`);
  }
}

// Fonts: self-hosted
const fonts = files.filter((f) => /\.woff2?$/.test(f));
if (!fonts.length) fail('no self-hosted font files found in dist');

// JSON validity
for (const j of ['.well-known/ilorium.json', 'examples/example-organism.evidence-bundle.example.json']) {
  try { JSON.parse(readFileSync(join(dist, j), 'utf8')); } catch (e) { fail(`${j}: invalid JSON (${e.message})`); }
}

if (errors.length) {
  console.error('\nverify-dist FAILED:\n' + errors.map((e) => ' - ' + e).join('\n') + '\n');
  process.exit(1);
}
console.log(`verify-dist OK: ${files.length} files, ${fonts.length} font files, headers hashed, no third-party URLs.`);
