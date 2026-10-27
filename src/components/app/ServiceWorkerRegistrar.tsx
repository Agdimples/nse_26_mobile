import { useEffect } from "react";
import { isAndroidBuild } from "@/lib/android-build";

/**
 * Registers the offline/service-worker for the app.
 *
 * Only runs in production builds: in `vite dev` the worker would sit in front
 * of the dev server and serve stale precached URLs after a code change.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    // Never register inside the Android APK build: the app is served from
    // packaged assets and there is no /sw.js to register.
    if (isAndroidBuild) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.warn("[sw] registration failed", error);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
