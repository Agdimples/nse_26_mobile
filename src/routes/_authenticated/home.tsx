import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Calendar,
  ConciergeBell,
  Compass,
  HeartPulse,
  Megaphone,
  Users,
  Sparkles,
} from "lucide-react";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

/* Homepage quick actions. City stuff (hotels, nearby, transport, maps)
   lives in one place: the Maiduguri guide — no duplicate tiles here. */
const tools = [
  { to: "/schedule", label: "Schedule", icon: Calendar, tint: "text-primary", bg: "bg-primary-soft" },
  { to: "/concierge", label: "Concierge", icon: ConciergeBell, tint: "text-warning-foreground", bg: "bg-accent-soft" },
  { to: "/network", label: "Network", icon: Users, tint: "text-success", bg: "bg-success-soft" },
  { to: "/maidguide", label: "Maiduguri", icon: Compass, tint: "text-primary", bg: "bg-primary-soft" },
  { to: "/announcements", label: "Updates", icon: Megaphone, tint: "text-primary", bg: "bg-primary-soft" },
  { to: "/emergency", label: "Emergency", icon: HeartPulse, tint: "text-destructive", bg: "bg-destructive-soft" },
] as const;

function HomePage() {
  const { user } = useAuth();

  const { data: announcement } = useQuery({
    queryKey: ["latest-announcement"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { title?: string; body?: string } | null;
    },
  });

  // Full display name (first names alone look wrong for "Engr. Musa Ibrahim Musa").
  const firstName = user?.user_metadata?.full_name ?? "Delegate";
  const countdown = countdownLabel();

  return (
    <div className="pb-16">
      {/* NseHeroHeader equivalent */}
      <section className="relative overflow-hidden rounded-b-[30px] bg-brand-gradient px-4 pb-6 pt-4 text-white shadow-elevated">
        <div className="hero-sheen pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <img
              src="/nse_crest.png"
              alt="NSE crest"
              className="h-11 w-11 rounded-full bg-white p-1 shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/65">
                GOOD DAY
              </p>
              <p className="truncate text-lg font-extrabold leading-tight">{firstName}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              {countdown}
            </span>
          </div>
          <div className="mt-3.5 flex items-center justify-between border-t border-white/15 pt-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                MAIDUGURI 2026
              </p>
              <p className="text-xs font-semibold text-white/90">
                {EVENT_CONFIG.dates}
              </p>
            </div>
            <Link
              to="/about"
              className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-white/30"
            >
              Conference Guide ›
            </Link>
          </div>
        </div>
      </section>

      <div className="space-y-4 px-4 pt-4">
        {/* Latest announcement card */}
        <Link to="/announcements" className="block">
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
                <Megaphone className="h-5 w-5 text-primary" />
              </span>
              <p className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Latest announcement
              </p>
              <span className="text-xs text-muted-foreground/60">›</span>
            </div>
            <p className="mt-3 text-lg font-extrabold leading-snug">
              {announcement?.title ?? "No updates yet"}
            </p>
            <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {announcement?.body ??
                "Conference announcements will appear here first."}
            </p>
          </div>
        </Link>

        {/* Quick actions — single elevated card with 4-col grid, like the APK */}
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quick actions
          </p>
          <div className="rounded-3xl bg-surface px-2 py-4 shadow-card">
            <div className="grid grid-cols-4 gap-x-1 gap-y-4">
              {tools.map(({ to, label, icon: Icon, tint, bg }) => (
                <Link key={to} to={to} className="flex flex-col items-center gap-1.5 transition active:scale-95">
                  <span className={`flex h-[50px] w-[50px] items-center justify-center rounded-2xl ${bg}`}>
                    <Icon className={`h-6 w-6 ${tint}`} />
                  </span>
                  <span className="max-w-full truncate px-1 text-[11px] font-semibold">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Concierge CTA */}
        <Link to="/concierge" className="block">
          <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-4 shadow-card">
            <span className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-success/20">
              <ConciergeBell className="h-6 w-6 text-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Need anything?</p>
              <p className="text-xs text-muted-foreground">
                Call an usher or order a meal.
              </p>
            </div>
            <span className="text-success">›</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* Countdown to the conference start (dates live in EVENT_CONFIG). */
function countdownLabel() {
  const start = EVENT_CONFIG.start;
  const end = EVENT_CONFIG.end;
  const now = new Date();
  if (now > end) return "See you next year";
  const days = Math.floor(
    (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  );
  if (days <= 0) return "Happening now";
  if (days === 1) return "Starts tomorrow";
  return `${days} days to go`;
}
