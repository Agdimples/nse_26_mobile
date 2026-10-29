import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONFERENCE_INFO } from "@/lib/reference";
import { EVENT_CONFIG } from "@/lib/event-config";
import {
  Calendar,
  ConciergeBell,
  Compass,
  HeartPulse,
  Megaphone,
  Users,
  Sparkles,
  MapPin,
  ArrowRight,
  Zap,
  Store,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

/* Quick-action tile config — colour palette per tile */
const tools = [
  {
    to: "/conference",
    label: "Conference",
    icon: Calendar,
    gradient: "from-blue-500 to-blue-700",
    shadow: "shadow-blue-500/30",
    ring: "ring-blue-400/30",
  },
  {
    to: "/exhibition",
    label: "Exhibition",
    icon: Store,
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-orange-400/30",
    ring: "ring-orange-300/30",
  },
  {
    to: "/network",
    label: "Network",
    icon: Users,
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/30",
    ring: "ring-emerald-400/30",
  },
  {
    to: "/concierge",
    label: "Concierge",
    icon: ConciergeBell,
    gradient: "from-violet-500 to-purple-700",
    shadow: "shadow-violet-500/30",
    ring: "ring-violet-400/30",
  },
  {
    to: "/maidguide",
    label: "Maiduguri",
    icon: Compass,
    gradient: "from-sky-400 to-cyan-600",
    shadow: "shadow-sky-400/30",
    ring: "ring-sky-300/30",
  },
  {
    to: "/announcements",
    label: "Updates",
    icon: Megaphone,
    gradient: "from-pink-500 to-rose-600",
    shadow: "shadow-pink-500/30",
    ring: "ring-pink-400/30",
  },
  {
    to: "/map",
    label: "3D Map",
    icon: MapPin,
    gradient: "from-indigo-500 to-blue-700",
    shadow: "shadow-indigo-500/30",
    ring: "ring-indigo-400/30",
  },
  {
    to: "/emergency",
    label: "Emergency",
    icon: HeartPulse,
    gradient: "from-red-500 to-rose-700",
    shadow: "shadow-red-500/30",
    ring: "ring-red-400/30",
  },
] as const;

function HomePage() {
  const { user } = useAuth();
  const info = CONFERENCE_INFO;

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

  const firstName = user?.user_metadata?.full_name ?? "Delegate";
  const countdown = countdownLabel();

  return (
    <div className="pb-24">
      {/* Official Hero Header */}
      <section className="relative overflow-hidden rounded-b-[32px] bg-brand-gradient px-4 pb-7 pt-4 text-white shadow-elevated">
        <div className="hero-sheen pointer-events-none absolute inset-0" />
        <div className="relative">
          {/* Top Attendee Greeting */}
          <div className="flex items-center gap-3">
            <img
              src="/nse_crest.png"
              alt="NSE crest"
              className="h-10 w-10 rounded-full bg-white p-1 shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                GOOD DAY
              </p>
              <p className="truncate text-base font-extrabold leading-tight">{firstName}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-accent" />
              {countdown}
            </span>
          </div>

          {/* Official Conference Showcase Card */}
          <div className="mt-4 rounded-2xl bg-white/10 p-4 text-center backdrop-blur-md border border-white/20 shadow-inner">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15 p-2 shadow-inner">
              <img
                src="/nse_crest.png"
                alt="NSE Crest"
                className="h-10 w-10 rounded-full bg-white p-0.5 object-contain shadow"
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
              {info.organizationName}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
              MAIDUGURI 2026
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-white/90">
              {info.conferenceTitle}
            </p>

            {/* Theme Box */}
            <div className="mx-auto mt-3.5 max-w-xs rounded-xl bg-black/25 p-2.5 text-center border border-white/15">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Theme
              </p>
              <p className="mt-0.5 text-xs font-bold leading-snug text-white">“{info.theme}”</p>
            </div>

            {/* Dates & Venue */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 font-medium">
                <Calendar className="h-3 w-3 text-emerald-300" />
                {info.dates}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 font-medium">
                <MapPin className="h-3 w-3 text-emerald-300" />
                ICC, Maiduguri
              </span>
            </div>

            {/* Direct Action Buttons */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                size="sm"
                asChild
                className="h-8 bg-accent text-accent-foreground font-bold hover:bg-accent/90 border-0 shadow"
              >
                <Link to="/conference">
                  Explore Conference
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                asChild
                className="h-8 bg-white/20 text-white hover:bg-white/30 border-0"
              >
                <Link to="/about">
                  About Conference
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4 px-4 pt-4">
        {/* 4 Key Conference Impact Stats */}
        <section>
          <div className="grid grid-cols-4 gap-2 text-center">
            {info.stats.map((s) => (
              <Card key={s.label} className="border-0 bg-surface p-2.5 shadow-card">
                <p className="text-base font-extrabold text-primary">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-tight text-muted-foreground">
                  {s.label}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick actions — 4-col grid with 8 actions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Quick Actions</p>
            <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary">
              <Zap className="h-3 w-3" />
              {tools.length} features
            </span>
          </div>

          <div className="rounded-3xl bg-surface p-4 shadow-card">
            <div className="grid grid-cols-4 gap-x-2 gap-y-5">
              {tools.map(({ to, label, icon: Icon, gradient, shadow, ring }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex flex-col items-center gap-2 transition-transform active:scale-90"
                >
                  {/* Icon bubble */}
                  <span
                    className={`relative flex h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-gradient-to-br ${gradient} shadow-lg ${shadow} ring-2 ${ring} transition-shadow group-active:shadow-md`}
                  >
                    {/* inner gloss */}
                    <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/20 to-transparent" />
                    <Icon className="h-6 w-6 text-white drop-shadow-sm" strokeWidth={2} />
                  </span>

                  {/* Label */}
                  <span className="max-w-[62px] text-center text-[11px] font-semibold leading-tight text-foreground/80">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

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
              {announcement?.body ?? "Conference announcements will appear here first."}
            </p>
          </div>
        </Link>

        {/* Concierge CTA */}
        <Link to="/concierge" className="block">
          <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-4 shadow-card">
            <span className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-success/20">
              <ConciergeBell className="h-6 w-6 text-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Need anything?</p>
              <p className="text-xs text-muted-foreground">Call an usher or order a meal.</p>
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
