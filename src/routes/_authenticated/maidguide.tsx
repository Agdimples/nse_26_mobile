import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { MapPin, Hotel, Coffee, Navigation, Bus, HelpCircle } from "lucide-react";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/_authenticated/maidguide")({
  component: MaidguidePage,
});

const tiles = [
  {
    to: "/map",
    label: "3D Venue & Outdoor Map",
    description: "Floor plan, realistic 3D buildings, 47 hotels & Maiduguri places.",
    icon: MapPin,
    tone: "bg-primary-soft text-primary",
  },
  {
    to: "/directions",
    label: "3D Live Directions",
    description: "Turn-by-turn routing with walk/drive modes & 3D camera.",
    icon: Navigation,
    tone: "bg-accent-soft text-warning-foreground",
  },
  {
    to: "/accommodation",
    label: "Hotels",
    description: "The full 46-hotel delegate masterlist with rates.",
    icon: Hotel,
    tone: "bg-primary-soft text-primary",
  },
  {
    to: "/nearby",
    label: "Nearby Places",
    description: "Security, hospitals, government offices & more.",
    icon: Coffee,
    tone: "bg-accent-soft text-warning-foreground",
  },
  {
    to: "/transport",
    label: "Shuttle Transport",
    description: "50 delegate buses, marshals and daily schedule.",
    icon: Bus,
    tone: "bg-primary-soft text-primary",
  },
  {
    to: "/faq",
    label: "About Conference",
    description: "40 searchable answers — wifi, badges, meals…",
    icon: HelpCircle,
    tone: "bg-accent-soft text-warning-foreground",
  },
] as const;

function MaidguidePage() {
  return (
    <div className="space-y-4 pb-24">
      <NsePageHeader
        title="Maidguide"
        subtitle={`Your guide to ${EVENT_CONFIG.venue.name} and Maiduguri.`}
        backTo="/home"
      />

      <div className="grid grid-cols-1 gap-3.5 px-4">
        {tiles.map(({ to, label, description, icon: Icon, tone }) => (
          <Link key={to} to={to} className="block transition active:scale-[0.99]">
            <Card className="flex items-center gap-3.5 border-0 bg-surface rounded-2xl p-4 shadow-card transition-shadow hover:shadow-md">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ${tone}`}>
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <span className="text-sm font-bold">›</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
