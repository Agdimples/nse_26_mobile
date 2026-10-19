import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Hotel, Utensils, Navigation, Bus, HelpCircle, ArrowRight, Compass } from "lucide-react";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/_authenticated/maidguide")({
  component: MaidguidePage,
});

const tiles = [
  {
    to: "/map",
    label: "3D Venue & Map",
    description: "Floor plan, realistic 3D buildings, 47 hotels & Maiduguri places.",
    icon: MapPin,
    gradient: "from-blue-500 to-blue-700",
    shadow: "shadow-blue-500/35",
    ring: "ring-blue-400/30",
    badge: "Interactive",
  },
  {
    to: "/directions",
    label: "Live Directions",
    description: "Turn-by-turn routing with walk/drive modes & 3D camera.",
    icon: Navigation,
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-orange-400/35",
    ring: "ring-orange-300/30",
    badge: "GPS",
  },
  {
    to: "/accommodation",
    label: "Hotels",
    description: "The full 40-hotel delegate masterlist with rates and photos.",
    icon: Hotel,
    gradient: "from-violet-500 to-purple-700",
    shadow: "shadow-violet-500/35",
    ring: "ring-violet-400/30",
    badge: "40 hotels",
  },
  {
    to: "/nearby",
    label: "Nearby Places",
    description: "Restaurants, hospitals, Security, government offices & more.",
    icon: Utensils,
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/35",
    ring: "ring-emerald-400/30",
    badge: "POIs",
  },
  {
    to: "/transport",
    label: "Shuttle Transport",
    description: "50 delegate buses, marshals and the full daily schedule.",
    icon: Bus,
    gradient: "from-sky-400 to-cyan-600",
    shadow: "shadow-sky-400/35",
    ring: "ring-sky-300/30",
    badge: "50 buses",
  },
  {
    to: "/faq",
    label: "Conference FAQ",
    description: "40 searchable answers — wifi, badges, meals and more.",
    icon: HelpCircle,
    gradient: "from-pink-500 to-rose-600",
    shadow: "shadow-pink-500/35",
    ring: "ring-pink-400/30",
    badge: "40 FAQs",
  },
] as const;

function MaidguidePage() {
  return (
    <div className="space-y-5 pb-28">
      <NsePageHeader
        title="Maiduguri"
        subtitle={`Your guide to ${EVENT_CONFIG.venue.name} and Maiduguri.`}
        backTo="/home"
      />

      {/* Intro banner */}
      <div className="mx-4 rounded-2xl bg-brand-gradient px-4 py-4 text-white shadow-elevated overflow-hidden relative">
        <div className="hero-sheen pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/20">
            <Compass className="h-6 w-6 text-white" />
          </span>
          <div>
            <p className="text-sm font-extrabold leading-tight">
              Navigate Maiduguri 2026
            </p>
            <p className="mt-0.5 text-xs text-white/80 leading-snug">
              Maps, hotels, transport and local info — all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div className="flex flex-col gap-3.5 px-4">
        {tiles.map(({ to, label, description, icon: Icon, gradient, shadow, ring, badge }) => (
          <Link
            key={to}
            to={to}
            className="group block transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-card transition-shadow group-hover:shadow-md overflow-hidden relative">

              {/* Subtle gradient tint on the left edge */}
             {/*  <div
                className={`pointer-events-none absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gradient-to-b ${gradient}`}
              /> */}

              {/* Icon bubble */}
              <span
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${gradient} shadow-lg ${shadow} ring-2 ${ring}`}
              >
                {/* gloss */}
                <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/25 to-transparent" />
                <Icon className="h-7 w-7 text-white drop-shadow-sm" strokeWidth={1.75} />
              </span>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-foreground leading-tight">{label}</p>
                  <span className={`rounded-full bg-gradient-to-br ${gradient} px-2 py-0.5 text-[10px] font-bold text-white shadow-sm`}>
                    {badge}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>

              {/* Arrow */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-md ${shadow}`}>
                <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="px-4 text-center text-xs text-muted-foreground">
        {EVENT_CONFIG.fullName} · {EVENT_CONFIG.dates}
      </p>
    </div>
  );
}
