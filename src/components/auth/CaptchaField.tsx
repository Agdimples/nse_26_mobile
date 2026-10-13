import { Turnstile } from "@marsidev/react-turnstile";
import { TURNSTILE_SITE_KEY, turnstileEnabled } from "@/lib/turnstile";

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
 */
export function CaptchaField({ onToken, nonce = 0 }: CaptchaFieldProps) {
  if (!turnstileEnabled) return null;

  return (
    <div className="flex justify-center py-1">
      <Turnstile
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
  );
}
