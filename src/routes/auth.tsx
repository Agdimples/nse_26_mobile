import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, stashPendingRoleCode } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { EVENT_CONFIG } from "@/lib/event-config";
import { CaptchaField } from "@/components/auth/CaptchaField";
import { turnstileEnabled } from "@/lib/turnstile";

/**
 * Real provider status is baked in at build time (see vite.config.ts):
 * the button renders only when a Google OAuth client is actually connected,
 * so we never show a sign-in option that can't work.
 */
declare const __GOOGLE_OAUTH__: boolean;
const GOOGLE_ENABLED = __GOOGLE_OAUTH__;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Sign in — ${EVENT_CONFIG.name} ${EVENT_CONFIG.year}` },
      { name: "description", content: "Sign in or create your account for the conference companion app." },
    ],
  }),
  component: AuthPage,
});
function AuthPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [signInRoleCode, setSignInRoleCode] = useState("");
  const [busy, setBusy] = useState(false);
  // Cloudflare Turnstile: the solved token + a nonce that remounts the widget
  // (tokens are single-use, so a retry needs a fresh challenge).
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const navigate = useNavigate();

  // Only block submit when protection is actually configured.
  const captchaPending = turnstileEnabled && !captchaToken;
  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  };

  // Already signed in? Send users to the app (effect, not a thrown redirect —
  // throwing during render crashes the route instead of navigating).
  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/home", replace: true });
    }
  }, [loading, user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (captchaPending) {
      return toast.error("Please complete the human verification check first.");
    }
    setBusy(true);
    if (signInRoleCode.trim()) stashPendingRoleCode(signInRoleCode);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setBusy(false);
    if (error) {
      resetCaptcha();
      return toast.error(error.message);
    }
    toast.success("Welcome back!");
    void navigate({ to: "/home", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (captchaPending) {
      return toast.error("Please complete the human verification check first.");
    }
    setBusy(true);
    if (roleCode.trim()) stashPendingRoleCode(roleCode);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: { full_name: fullName },
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
    setBusy(false);
    if (error) {
      resetCaptcha();
      return toast.error(error.message);
    }
    toast.success("Account created! Check your inbox to confirm your email.");
  }

  async function signInWithGoogle() {
    setBusy(true);
    if (roleCode.trim() || signInRoleCode.trim()) {
      stashPendingRoleCode(roleCode.trim() || signInRoleCode.trim());
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
    }
    // On success the browser navigates away to Google; nothing else to do.
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-gradient px-5 py-10 text-white">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 p-2 shadow-inner backdrop-blur-md">
            <img
              src="/nse_crest.png"
              alt="NSE Crest"
              className="h-12 w-12 rounded-full bg-white p-1 object-contain shadow"
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/80">
            {EVENT_CONFIG.dates}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            {EVENT_CONFIG.name} <span className="text-accent">{EVENT_CONFIG.year}</span>
          </h1>
          <p className="mt-2 text-sm text-white/70">{EVENT_CONFIG.tagline}</p>
        </div>

        <Card className="p-5">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5 space-y-4">
              <form onSubmit={signIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pass">Password</Label>
                  <Input id="si-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-code">
                    Role code <span className="text-muted-foreground">(optional — staff only)</span>
                  </Label>
                  <Input
                    id="si-code"
                    value={signInRoleCode}
                    onChange={(e) => setSignInRoleCode(e.target.value)}
                    placeholder="e.g. NSE-KITCHEN-3046"
                    autoCapitalize="characters"
                  />
                </div>
                <CaptchaField onToken={setCaptchaToken} nonce={captchaNonce} />
                <Button type="submit" className="w-full" disabled={busy || captchaPending}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5 space-y-4">
              <form onSubmit={signUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Chinedu Okafor" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">Password</Label>
                  <Input id="su-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-code">
                    Role code <span className="text-muted-foreground">(optional — staff only)</span>
                  </Label>
                  <Input
                    id="su-code"
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    placeholder="e.g. NSE-COMMS-4837"
                    autoCapitalize="characters"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave blank to join as an attendee. Codes are applied on first sign-in.
                  </p>
                </div>
                <CaptchaField onToken={setCaptchaToken} nonce={captchaNonce} />
                <Button type="submit" className="w-full" disabled={busy || captchaPending}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {GOOGLE_ENABLED && (
            <>
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={() => void signInWithGoogle()}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.7-.2-2.5H12v4.7h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.8z" />
                  <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.3v3.1C3.3 21.6 7.3 24 12 24z" />
                  <path fill="#FBBC05" d="M5.3 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4v-3H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3z" />
                  <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8L20 3.1C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.4 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
                </svg>
                Continue with Google
              </Button>
            </>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-white/60">
          By signing in you agree to the conference code of conduct.
        </p>
        <p className="mt-2 text-center text-xs">
          <Link to="/" className="text-white/70 hover:text-white">← Back</Link>
        </p>
      </div>
    </div>
  );
}
