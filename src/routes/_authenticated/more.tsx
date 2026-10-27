import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { initials } from "@/lib/format";
import {
  ShieldAlert,
  Megaphone,
  User,
  LogOut,
  Wifi,
  Settings2,
  MessageCircle,
  KeyRound,
  Bus,
  HelpCircle,
  Info,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { EVENT_CONFIG } from "@/lib/event-config";
import { isAndroidBuild } from "@/lib/android-build";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/more")({
  component: MorePage,
});

// ---------------------------------------------------------------------------
// Menu sections
// ---------------------------------------------------------------------------

const CONFERENCE_ITEMS: { to: string; label: string; icon: LucideIcon; desc: string; danger?: boolean }[] = [
  { to: "/announcements",  label: "Announcements",          icon: Megaphone,     desc: "Updates & notices" },
  { to: "/transport",      label: "Shuttle Transport",       icon: Bus,           desc: "Bus schedule & marshals" },
  { to: "/network",        label: "Networking",              icon: MessageCircle, desc: "Connect with attendees" },
  { to: "/emergency",      label: "Emergency",               icon: ShieldAlert,   desc: "Contacts & safety info",   danger: true },
];

const ACCOUNT_ITEMS = [
  { to: "/profile",  label: "Edit profile",  icon: User,       desc: "Name, title & avatar" },
] as const;

const INFO_ITEMS = [
  { to: "/faq",     label: "Conference FAQ",          icon: HelpCircle,  desc: "40 searchable answers" },
  { to: "/about",   label: "About Maiduguri 2026",    icon: Info,        desc: "Event overview & theme" },
  { to: "/privacy", label: "Privacy policy",          icon: ShieldCheck, desc: "Data & cookies" },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function MorePage() {
  const { user, isAdmin, signOut, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [codeOpen, setCodeOpen]   = useState(false);
  const [code, setCode]           = useState("");
  const [busy, setBusy]           = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  // Fetch profile for the header avatar
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name,avatar_url,title,company").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  /** Triggers the native Play update flow. Only reachable in the Android
   *  build, whose launcher registers the window.NseApp JS bridge. */
  function checkForAppUpdate() {
    const bridge = (window as unknown as {
      NseApp?: { checkForUpdate?: () => void; openPlayStore?: () => void };
    }).NseApp;
    if (typeof bridge?.checkForUpdate === "function") {
      toast.info("Checking with Google Play for a newer version…");
      bridge.checkForUpdate();
    } else if (typeof bridge?.openPlayStore === "function") {
      bridge.openPlayStore();
    } else {
      toast.info("You are on the website — there is nothing to update here.");
    }
  }

  async function redeem() {
    if (!code.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_signup_code", { _code: code.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    const label = Array.isArray(data) && data[0]?.label;
    toast.success(label ? `Role granted: ${label}` : "Role granted");
    setCode("");
    setCodeOpen(false);
    await refreshRoles();
  }

  function copyWifi() {
    navigator.clipboard.writeText(EVENT_CONFIG.wifi.password).then(() => {
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 2000);
    });
  }

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "Delegate";

  return (
    <div className="pb-28">
      {/* ── Profile hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-b-[32px] bg-brand-gradient px-4 pb-7 pt-12 text-white shadow-elevated">
        <div className="hero-sheen pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-4">
          <Avatar className="h-16 w-16 shrink-0 border-[3px] border-white/30 shadow-lg ring-2 ring-white/10">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-white/20 text-xl font-extrabold text-white backdrop-blur-sm">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold leading-tight">{displayName}</p>
            {profile?.title && (
              <p className="mt-0.5 truncate text-xs text-white/70">{profile.title}</p>
            )}
            {profile?.company && (
              <p className="truncate text-xs font-semibold text-white/80">{profile.company}</p>
            )}
            {!profile?.title && user?.email && (
              <p className="truncate text-xs text-white/60">{user.email}</p>
            )}
          </div>
          <Link
            to="/profile"
            className="ml-auto shrink-0 rounded-full bg-white/15 p-2 backdrop-blur-sm transition hover:bg-white/25"
            aria-label="Edit profile"
          >
            <User className="h-4 w-4 text-white" />
          </Link>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-5">

        {/* ── Wi-Fi card ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 rounded-2xl bg-white border border-border/50 shadow-card p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
            <Wifi className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Conference Wi-Fi
            </p>
            <p className="font-mono text-sm font-bold text-foreground">{EVENT_CONFIG.wifi.ssid}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {EVENT_CONFIG.wifi.password}
            </p>
          </div>
          <button
            onClick={copyWifi}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-muted"
            aria-label="Copy Wi-Fi password"
          >
            {wifiCopied
              ? <Check className="h-4 w-4 text-green-600" />
              : <Copy className="h-4 w-4 text-muted-foreground" />
            }
          </button>
        </div>

        {/* ── Conference section ──────────────────────────────────────────── */}
        <MenuSection label="Conference">
          {CONFERENCE_ITEMS.map(({ to, label, icon: Icon, desc, danger }) => (
            <MenuItem
              key={to}
              to={to}
              label={label}
              desc={desc}
              icon={<Icon className={`h-4.5 w-4.5 ${danger ? "text-destructive" : "text-muted-foreground"}`} />}
              iconBg={danger ? "bg-red-50 border-red-200" : "bg-muted border-border"}
              danger={danger}
            />
          ))}
        </MenuSection>

        {/* ── Account section ─────────────────────────────────────────────── */}
        <MenuSection label="Account">
          {ACCOUNT_ITEMS.map(({ to, label, icon: Icon, desc }) => (
            <MenuItem
              key={to}
              to={to}
              label={label}
              desc={desc}
              icon={<Icon className="h-4.5 w-4.5 text-muted-foreground" />}
              iconBg="bg-muted border-border"
            />
          ))}

          {/* Redeem code */}
          <div className="border-t border-border first:border-t-0">
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-muted/40 active:bg-muted"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-muted border-border">
                <KeyRound className="h-4.5 w-4.5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Redeem role code</p>
                <p className="text-xs text-muted-foreground">Unlock staff or admin access</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </button>
          </div>

          {/* Admin — only when applicable */}
          {isAdmin && (
            <div className="border-t border-border">
              <Link
                to="/admin"
                className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-muted/40 active:bg-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-primary/8 border-primary/20">
                  <Settings2 className="h-4.5 w-4.5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">Admin dashboard</p>
                  <p className="text-xs text-muted-foreground">Manage sessions, speakers & more</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </Link>
            </div>
          )}
        </MenuSection>

        {/* ── Info section ────────────────────────────────────────────────── */}
        <MenuSection label="Information">
          {INFO_ITEMS.map(({ to, label, icon: Icon, desc }) => (
            <MenuItem
              key={to}
              to={to}
              label={label}
              desc={desc}
              icon={<Icon className="h-4.5 w-4.5 text-muted-foreground" />}
              iconBg="bg-muted border-border"
            />
          ))}
        </MenuSection>

        {/* ── Sign out ────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => {
            void signOut();
            toast.success("Signed out");
            void navigate({ to: "/auth", replace: true });
          }}
          className="flex w-full items-center gap-3.5 rounded-2xl border border-destructive/20 bg-white px-4 py-3.5 text-left shadow-card transition hover:bg-destructive/5 active:bg-destructive/10"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-red-50 border-red-200">
            <LogOut className="h-4.5 w-4.5 text-destructive" />
          </span>
          <span className="flex-1 text-sm font-semibold text-destructive">Sign out</span>
        </button>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1 pt-2 pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground/50" />
            <p className="text-[11px] font-semibold text-muted-foreground/70">
              {EVENT_CONFIG.name} {EVENT_CONFIG.year}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground/50">{EVENT_CONFIG.dates}</p>
        </div>
      </div>

      {/* ── Redeem role code dialog ──────────────────────────────────────── */}
      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-primary" />
              Redeem a role code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Access code
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. NSE-KITCHEN-3046"
                autoCapitalize="characters"
                className="rounded-xl font-mono"
                onKeyDown={(e) => e.key === "Enter" && void redeem()}
              />
            </div>
            <Button
              onClick={() => void redeem()}
              disabled={busy || !code.trim()}
              className="w-full rounded-xl"
            >
              {busy ? "Redeeming…" : "Redeem code"}
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your role unlocks the matching admin tabs immediately — no need to sign out.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable menu components
// ---------------------------------------------------------------------------

function MenuSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-card divide-y divide-border">
        {children}
      </div>
    </section>
  );
}

function MenuItem({
  to,
  label,
  desc,
  icon,
  iconBg,
  danger,
}: {
  to: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
  danger?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-muted/40 active:bg-muted first:rounded-t-2xl last:rounded-b-2xl"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </Link>
  );
}
