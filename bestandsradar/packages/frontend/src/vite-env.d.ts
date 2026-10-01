/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_JTL_ISSUER?: string;
  readonly VITE_JTL_CLIENT_ID?: string;
  readonly VITE_JTL_SCOPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
