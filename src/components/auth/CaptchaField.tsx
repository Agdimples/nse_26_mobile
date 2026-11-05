import { lazy, Suspense } from "react";
import { TURNSTILE_SITE_KEY, turnstileEnabled } from "@/lib/turnstile";

// Lazy-load the Turnstile widget so the Cloudflare script is never injected
// into the page when CAPTCHA protection is disabled. A static import would
// cause @marsidev/react-turnstile to append the script tag unconditionally,
// which triggers "Tracking Prevention blocked access to storage" warnings in
// Edge/Firefox even when the widget never renders.
const TurnstileWidget = lazy(() =>
  import("@marsidev/react-turnstile").then((m) => ({ default: m.Turnstile }))
);

type CaptchaFieldProps = {
  /** Receives the challenge token when solved, or `null` when it expires/fails. */
  onToken: (token: string | null) => void;
  /**
   * Bump this to force a brand-new widget. Turnstile tokens are single-use, so
   * every failed auth attempt must clear the old token before a retry.
   */
  nonce?: number;
};

/**
 * Cloudflare Turnstile ("are you a robot?") challenge.
 *
 * Renders nothing when no site key is configured, so local/dev environments
 * without Turnstile keep working while Supabase's CAPTCHA protection is off.
 * The Turnstile script is only fetched when the site key is actually set.
 */
export function CaptchaField({ onToken, nonce = 0 }: CaptchaFieldProps) {
  if (!turnstileEnabled) return null;

  return (
    <Suspense fallback={<div className="h-[65px]" />}>
      <div className="flex justify-center py-1">
        <TurnstileWidget
          key={nonce}
          siteKey={TURNSTILE_SITE_KEY}
          options={{ theme: "auto", size: "flexible" }}
          onSuccess={(token) => onToken(token)}
          onExpire={() => onToken(null)}
          onError={() => onToken(null)}
          onTimeout={() => onToken(null)}
          onUnsupported={() => onToken(null)}
        />
      </div>
    </Suspense>
  );
}
