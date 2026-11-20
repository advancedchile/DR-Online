/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_DATABASE_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_GAME_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
