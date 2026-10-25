// Build-time Android flag. vite.config.android.ts defines
// __IS_ANDROID_BUILD__ = true (Vite `define` rewrites the bare identifier to
// the literal `true` in every bundle); web builds leave it un-replaced.
declare const __IS_ANDROID_BUILD__: boolean | undefined;

/**
 * True only in the Android APK web bundle when running in the WebView.
 * The `typeof window` guard matters: the SPA prerender also evaluates this
 * file inside Node during the build, and creating a history object without
 * a DOM crashes the prerender. Keep referencing the bare identifier — that
 * is what Vite's `define` rewrites.
 */
export const isAndroidBuild: boolean =
  typeof window !== "undefined" && __IS_ANDROID_BUILD__ === true;
