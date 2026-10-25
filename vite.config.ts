import { readFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Nitro bundles the Flutter `assets/` directory as server assets and imports
// those JSON files via `raw:<file>` specifiers. Its raw plugin emits the file
// text as `export default "<text>"` with moduleType "js" — but the virtual id
// still ends in .json, and Vite's JSON plugin then JSON.parses the emitted
// *module code* and the build fails. This plugin intercepts `raw:*.json`
// specifiers before Nitro's raw plugin and serves the identical default-
// exported-string module under a virtual id WITHOUT the .json suffix, so
// vite:json never engages.
function nitroRawJsonCompat() {
  const files = new Map<string, string>();

  return {
    name: "cc-nitro-raw-json-compat",
    enforce: "pre" as const,
    resolveId: {
      order: "pre" as const,
      handler(id: string) {
        if (!id.startsWith("raw:") || !id.endsWith(".json")) return null;
        const file = resolvePath(id.slice(4));
        const virtualId = `\0cc-raw:${file.replace(/\.json$/i, "")}.ccjson`;
        files.set(virtualId, file);
        return virtualId;
      },
    },
    load(id: string) {
      const file = files.get(id);
      if (!file) return null;
      const text = readFileSync(file, "utf8");
      return `export default ${JSON.stringify(text)};\n`;
    },
  };
}

export default defineConfig(({ mode }) => ({
  // Build-time flag: show "Continue with Google" only when a Google OAuth
  // client is actually configured (set VITE_GOOGLE_OAUTH_ENABLED=1 in the
  // environment / on Vercel once the provider is connected in Supabase).
  define: {
    __GOOGLE_OAUTH__: JSON.stringify(process.env.VITE_GOOGLE_OAUTH_ENABLED === "1"),
    // Android builds define this to true; the web build must still define it
    // (as false): src/lib/android-build.ts is sometimes executed
    // untransformed (dev serve, SSR module graph), where a bare undeclared
    // identifier is a hard ReferenceError that blanks the whole app.
    __IS_ANDROID_BUILD__: JSON.stringify(false),
  },
  plugins: [
    nitroRawJsonCompat(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      prerender: { enabled: false },
    }),
    // Must come AFTER tanstackStart (router plugin) but BEFORE nitro, so
    // TanStack Start dev mode can resolve /@react-refresh.
    react(),
    // Deploy target: Vercel (serverless SSR). Pages own their headers; data
    // comes from bundled JSON until Supabase env vars are added.
    nitro({ preset: "vercel" }),
  ],
}));
