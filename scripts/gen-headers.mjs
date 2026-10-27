// Post-build: compute SHA-256 hashes of every inline <script>/<style> Astro emitted and write them into dist/_headers.
// This keeps script-src/style-src free of 'unsafe-inline' for elements (only inline style="" attributes are allowed).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const scripts = new Set();
const styles = new Set();
const h = (s) => "'sha256-" + createHash('sha256').update(s, 'utf8').digest('base64') + "'";

for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1];
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/type\s*=\s*["'](?!module)(?:application\/ld\+json|application\/json|importmap)/i.test(attrs)) continue;
    if (m[2].trim()) scripts.add(h(m[2]));
  }
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    if (m[1].trim()) styles.add(h(m[1]));
  }
}

const path = join(dist, '_headers');
let txt = readFileSync(path, 'utf8');
txt = txt.replace('{{SCRIPT_HASHES}}', [...scripts].join(' ')).replace('{{STYLE_HASHES}}', [...styles].join(' '));
writeFileSync(path, txt);
console.log(`gen-headers: ${scripts.size} inline script hash(es), ${styles.size} inline style hash(es).`);
