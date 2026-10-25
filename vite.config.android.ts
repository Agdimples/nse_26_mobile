// Dedicated Vite config for the Android full-offline build.
//
// This produces a single-page-application bundle of the whole web app that is
// embedded into the Android APK (android/app/src/main/assets/web) and served
// by the WebView entirely on-device — the UI renders even with zero network.
// Only DATA (Supabase REST/auth, the AI chat API) needs connectivity.
//
// Key differences from vite.config.ts:
//   - `spa.enabled` (TanStack Start documented SPA mode): no SSR, one
//     prerendered shell emitted as index.html.
//   - `base: "/assets/"`: matches the WebViewAssetLoader path scheme so
//     asset URLs resolve inside the APK.
//   - hash history: the router runs from a single index.html, so deep links
//     must be fragments, not pathnames (WebViewAssetLoader only serves the
//     shell for /assets/).
//   - Nitro is dropped: there is no server in an APK.
//
// The production Vercel build (vite.config.ts) is untouched.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  base: "/assets/",
  define: {
    // NOTE(esbuild semantics): member expressions are only replaced when the
    // dotted key is defined exactly. Plain `__IS_ANDROID_BUILD__` would NOT
    // rewrite `globalThis.__IS_ANDROID_BUILD__`.
    "globalThis.__IS_ANDROID_BUILD__": "true",
    "__IS_ANDROID_BUILD__": "true",
    __GOOGLE_OAUTH__: JSON.stringify(false),
    // SPA build flags: swap hash history in and disable the service worker
    // (there is no /sw.js inside an APK and WebView caches its own assets).
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          outputPath: "/index.html",
        },
      },
    }),
    react(),
  ],
  build: {
    outDir: "dist-android",
    // Larger budget: this bundle carries the whole app on-device.
    chunkSizeWarningLimit: 4000,
  },
});
