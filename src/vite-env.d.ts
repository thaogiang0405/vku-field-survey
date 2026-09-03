/// <reference types="vite/client" />

declare module 'vite' {
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
