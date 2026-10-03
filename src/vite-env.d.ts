/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional REST Countries v5 API key. When set at build time the app will
   * try the live API first and merge it over the bundled offline dataset.
   * When unset the app uses the bundled dataset only (fully offline).
   */
  readonly VITE_REST_COUNTRIES_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
