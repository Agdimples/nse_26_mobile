// Build-time flag: set to true only by vite.config.android.ts (via `define`).
// Web builds leave it undefined. Lets Android-only branches typecheck.
declare global {
  interface GlobalThis {
    __IS_ANDROID_BUILD__?: boolean;
  }
}

export {};
