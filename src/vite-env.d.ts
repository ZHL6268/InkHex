/// <reference types="vite/client" />

declare const __APP_GEMINI_API_KEY__: string;

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly GEMINI_API_KEY?: string;
}
