import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    // PKCE flow: Supabase puts the authorization code in ?code=...
    // (an error lands here as ?error=... — handled by the component).
  },
  component: AuthCallback,
});

function AuthCallback() {
  const [message, setMessage] = useState("Signing you in…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function handle() {
      const params = new URLSearchParams(window.location.search);
      const recoveryFlow = params.get("flow") === "recovery";
      if (recoveryFlow) setMessage("Preparing your password reset…");
      const error = params.get("error_description") || params.get("error");
      if (error) {
        setMessage(`${recoveryFlow ? "Password reset" : "Sign-in"} failed: ${error}`);
        setTimeout(() => window.location.replace("/auth"), 2500);
        return;
      }
      const code = params.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          setMessage(`${recoveryFlow ? "Password reset" : "Sign-in"} failed: ${exErr.message}`);
          setTimeout(() => window.location.replace("/auth"), 2500);
          return;
        }
      } else {
        // Hash-style implicit flow fallback
        const { error: hashErr } = await supabase.auth.getSession();
        if (hashErr) {
          setMessage(`${recoveryFlow ? "Password reset" : "Sign-in"} failed: ${hashErr.message}`);
          setTimeout(() => window.location.replace("/auth"), 2500);
          return;
        }
      }
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        window.location.replace(recoveryFlow ? "/auth?recovery=1" : "/home");
      } else {
        setMessage("No session — redirecting to sign in…");
        setTimeout(() => window.location.replace("/auth"), 1500);
      }
    }
    void handle();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient px-6 text-white">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <p className="mt-4 text-sm text-white/80">{message}</p>
      </div>
    </div>
  );
}
