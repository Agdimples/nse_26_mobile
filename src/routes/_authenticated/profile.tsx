import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState({
    display_name: "",
    company: "",
    title: "",
    bio: "",
    avatar_url: "",
    networking_opt_in: true,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        company: profile.company ?? "",
        title: profile.title ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
        networking_opt_in: profile.networking_opt_in,
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Your Profile"
        subtitle="How other attendees see you in the network"
        backTo="/more"
      />

      <div className="space-y-4 px-4 pt-4">
        <Card className="border-0 bg-surface rounded-2xl p-5 shadow-card">
          <div className="mb-5 flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
              <AvatarImage src={form.avatar_url || undefined} />
              <AvatarFallback className="text-lg font-bold bg-primary-soft text-primary">{initials(form.display_name || "?")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Avatar URL</Label>
              <Input
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                placeholder="https://…"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dn">Display name</Label>
              <Input id="dn" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Civil Engineer" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company / Branch</Label>
                <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. NSE Maiduguri Branch" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A line or two about your engineering discipline and focus." className="rounded-xl" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Show me in the attendee directory</p>
                <p className="text-xs text-muted-foreground">Other attendees can find and message you.</p>
              </div>
              <Switch
                checked={form.networking_opt_in}
                onCheckedChange={(v) => setForm({ ...form, networking_opt_in: v })}
              />
            </div>
          </div>

          <Button className="mt-5 w-full" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </Card>

        {user?.email && <ChangePasswordCard email={user.email} />}
      </div>
    </div>
  );
}

// Security-sensitive change: require a fresh email OTP before the password
// can be replaced. Flow: send code (sign-in OTP, no account creation) →
// verify → set the new password.
function ChangePasswordCard({ email }: { email: string }) {
  const [stage, setStage] = useState<"idle" | "code" | "confirm">("idle");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setStage("code");
    toast.info("A 6-digit confirmation code was sent to your email.");
  }

  async function submitStage(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (stage === "code") {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: "email",
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Code verified — now choose your new password.");
      setStage("confirm");
      return;
    }
    if (pw.length < 6) {
      setBusy(false);
      return toast.error("Use at least 6 characters.");
    }
    if (pw !== pw2) {
      setBusy(false);
      return toast.error("The two passwords do not match.");
    }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password changed.");
    setStage("idle");
    setOtp("");
    setPw("");
    setPw2("");
  }

  return (
    <Card className="border-0 bg-surface rounded-2xl p-5 shadow-card">
      <p className="text-sm font-bold">Change password</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Protected by a 6-digit code sent to <span className="font-medium">{email}</span>.
      </p>
      {stage === "idle" ? (
        <Button variant="outline" className="mt-4 w-full" disabled={busy} onClick={() => void sendCode()}>
          {busy ? "Sending…" : "Email me a confirmation code"}
        </Button>
      ) : (
        <form onSubmit={submitStage} className="mt-4 space-y-3">
          {stage === "code" && (
            <div className="space-y-1.5">
              <Label htmlFor="pw-otp">6-digit code</Label>
              <Input
                id="pw-otp"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center font-mono tracking-[0.4em]"
                placeholder="••••••"
              />
            </div>
          )}
          {stage === "confirm" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pw-new">New password</Label>
                <Input
                  id="pw-new"
                  type="password"
                  required
                  minLength={6}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-confirm">Confirm new password</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  required
                  minLength={6}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                />
              </div>
            </>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={busy || (stage === "code" && otp.trim().length < 6)}
          >
            {busy ? "Working…" : stage === "code" ? "Verify code" : "Change password"}
          </Button>
          <button
            type="button"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            disabled={busy}
            onClick={() => {
              setStage("idle");
              setOtp("");
              setPw("");
              setPw2("");
            }}
          >
            Cancel
          </button>
        </form>
      )}
    </Card>
  );
}
