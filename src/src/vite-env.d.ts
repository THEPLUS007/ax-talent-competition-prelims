/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_AUTO_FALLBACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
