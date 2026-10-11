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
    description: "10 delegate buses, marshals and daily schedule.",
    icon: Bus,
    tone: "bg-primary-soft text-primary",
  },
  {
    to: "/faq",
    label: "Conference Guide",
    description: "40 searchable answers — wifi, badges, meals…",
    icon: HelpCircle,
    tone: "bg-accent-soft text-warning-foreground",
  },
] as const;

function MaidguidePage() {
  return (
    <div className="space-y-4 pb-16">
      <NsePageHeader
        title="Maidguide"
        subtitle={`Your guide to ${EVENT_CONFIG.venue.name} and Maiduguri.`}
        backTo="/home"
      />

      <div className="grid grid-cols-1 gap-3 px-4">
        {tiles.map(({ to, label, description, icon: Icon, tone }) => (
          <Link key={to} to={to} className="block transition active:scale-[0.99]">
            <Card className="flex items-center gap-4 border-0 p-4 shadow-card">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
              <span className="text-muted-foreground">›</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
