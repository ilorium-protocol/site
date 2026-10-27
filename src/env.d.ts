/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly PUBLIC_REPO_LIVE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
