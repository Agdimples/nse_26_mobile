// Cloudflare Turnstile config for the app's bot protection.
//
// The *site key* is public — it is embedded in the browser bundle by design —
// so it is safe to expose through a `VITE_` env var. The matching *secret key*
// is what proves the token server-side, and that lives only in the Supabase
// dashboard (Settings → Authentication → Bot and Abuse Protection), never here.
//
// When the site key is unset the widget stays hidden and no `captchaToken` is
// sent, which is the correct behaviour while Supabase's CAPTCHA protection is
// still switched off. Set both sides to turn protection on.
export const TURNSTILE_SITE_KEY: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TURNSTILE_SITE_KEY) || "";

export const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);
