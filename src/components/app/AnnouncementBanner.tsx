import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ConciergeBell,
  HandHeart,
  Megaphone,
  MapPin,
  Sparkles,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_CONFIG } from "@/lib/event-config";

type Slide = {
  id: string;
  label: string;
  title: string;
  body: string;
  icon: LucideIcon;
  to: "/announcements" | "/conference" | "/concierge" | "/maidguide" | "/chatbot";
  urgent?: boolean;
};

type AnnouncementRow = { id: string; title: string; body: string; priority?: string | null };

const ROTATE_MS = 6000;
// Below this many real announcements, welcome messages are mixed in.
const MIN_ANNOUNCEMENTS = 3;
const MAX_ANNOUNCEMENTS = 5;

function welcomeSlides(firstName: string): Slide[] {
  const greeting =
    firstName && firstName !== "Delegate" ? `Welcome, ${firstName}!` : "Welcome, Delegate!";
  return [
    {
      id: "welcome-main",
      label: "Welcome",
      title: greeting,
      body: `We're glad you're joining ${EVENT_CONFIG.brandName}. Explore the app to plan your week.`,
      icon: HandHeart,
      to: "/conference",
    },
    {
      id: "welcome-programme",
      label: "Programme",
      title: "Plan your days",
      body: "Browse the schedule, save the sessions you care about and never miss a keynote.",
      icon: Calendar,
      to: "/conference",
    },
    {
      id: "welcome-concierge",
      label: "Concierge",
      title: "Need anything?",
      body: "Call an usher or order a meal without leaving your seat.",
      icon: ConciergeBell,
      to: "/concierge",
    },
    {
      id: "welcome-ai",
      label: "Ask the assistant",
      title: "Questions about the conference?",
      body: "Ask the AI concierge about sessions, speakers, hotels, shuttles and where to eat.",
      icon: Sparkles,
      to: "/chatbot",
    },
    {
      id: "welcome-maiduguri",
      label: "Explore Maiduguri",
      title: "Make the most of your stay",
      body: "Restaurants, landmarks and local tips are in the Maiduguri guide.",
      icon: MapPin,
      to: "/maidguide",
    },
    {
      id: "welcome-wifi",
      label: "Stay connected",
      title: `Wi-Fi: ${EVENT_CONFIG.wifi.ssid}`,
      body: `Password: ${EVENT_CONFIG.wifi.password}`,
      icon: Wifi,
      to: "/chatbot",
    },
  ];
}

export function AnnouncementBanner({ firstName }: { firstName: string }) {
  const { data } = useQuery({
    queryKey: ["home-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(MAX_ANNOUNCEMENTS);
      return (data ?? []) as AnnouncementRow[];
    },
    refetchInterval: 60_000,
  });

  const slides = useMemo<Slide[]>(() => {
    const announcements: Slide[] = (data ?? []).map((a, i) => {
      // "high" is the legacy value saved by older admin forms.
      const urgent = a.priority === "urgent" || a.priority === "high";
      return {
        id: `announcement-${a.id}`,
        label: urgent ? "Urgent announcement" : i === 0 ? "Latest announcement" : "Announcement",
        title: a.title,
        body: a.body,
        icon: Megaphone,
        to: "/announcements" as const,
        urgent,
      };
    });
    if (announcements.length >= MIN_ANNOUNCEMENTS) return announcements;

    // Interleave welcome messages so the banner keeps moving when there's little news.
    const welcomes = welcomeSlides(firstName);
    const mixed: Slide[] = [];
    let w = 0;
    for (const a of announcements) {
      mixed.push(a, welcomes[w++ % welcomes.length]);
    }
    while (mixed.length < MIN_ANNOUNCEMENTS + 2) mixed.push(welcomes[w++ % welcomes.length]);
    return mixed;
  }, [data, firstName]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length, index]);

  const current = slides[index % slides.length];
  const Icon = current.icon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-surface shadow-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Announcements and welcome messages"
    >
      {current.urgent && <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />}
      <Link to={current.to} className="block p-4">
        <div
          key={current.id}
          className="animate-in fade-in slide-in-from-right-6 duration-500 motion-reduce:animate-none"
          aria-live={paused ? "polite" : "off"}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                current.urgent ? "bg-destructive/10" : "bg-primary-soft"
              }`}
            >
              <Icon className={`h-5 w-5 ${current.urgent ? "text-destructive" : "text-primary"}`} />
            </span>
            <p className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {current.label}
            </p>
            <span className="text-xs text-muted-foreground/60">›</span>
          </div>
          <p className="mt-3 line-clamp-2 text-lg font-extrabold leading-snug">{current.title}</p>
          <p className="mt-1.5 line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed text-muted-foreground">
            {current.body}
          </p>
        </div>
      </Link>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show message ${i + 1} of ${slides.length}`}
              aria-current={i === index % slides.length}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index % slides.length ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
