import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Static output. No SSR, no adapter: the build is a folder of files.
export default defineConfig({
  site: 'https://ilorium.com',
  output: 'static',
  integrations: [react()],
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Strict CSP: no inline stylesheets, no data: fonts. Everything is a file on our own origin.
    inlineStylesheets: 'never',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
  devToolbar: { enabled: false },
});
