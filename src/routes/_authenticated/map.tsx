import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OsmOutdoorMap } from "@/components/app/OsmOutdoorMap";
import { ClientOnly } from "@/components/app/ClientOnly";
import { EVENT_CONFIG } from "@/lib/event-config";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { NsePageHeader } from "@/components/app/NsePageHeader";

type Search = { room?: string };

export const Route = createFileRoute("/_authenticated/map")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    room: typeof s.room === "string" ? s.room : undefined,
  }),
  component: MapPage,
});

// Pre-positioned hotspots on the floor plan (percentages)
const HOTSPOTS = [
  { id: "lobby", name: "Main Lobby", x: 50, y: 12, tone: "bg-accent" },
  { id: "grand", name: "Grand Hall", x: 50, y: 38, tone: "bg-primary" },
  { id: "hallA", name: "Hall A", x: 20, y: 55, tone: "bg-primary" },
  { id: "hallB", name: "Hall B", x: 80, y: 55, tone: "bg-primary" },
  { id: "workshop", name: "Workshop Room 1", x: 22, y: 78, tone: "bg-primary" },
  { id: "courtyard", name: "Courtyard", x: 50, y: 65, tone: "bg-success" },
  { id: "rooftop", name: "Rooftop Terrace", x: 78, y: 88, tone: "bg-accent" },
];

function MapPage() {
  const { room } = Route.useSearch();
  const [tab, setTab] = useState<"venue" | "outdoor">("venue");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (room) {
      const hit = HOTSPOTS.find((h) => h.name === room);
      if (hit) setSelected(hit.id);
    }
  }, [room]);

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Venue & 3D Map"
        subtitle={`${EVENT_CONFIG.venue.name} · Indoor & outdoor`}
        backTo="/home"
      />

      <div className="space-y-4 px-4 pt-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "venue" | "outdoor")}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="venue" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Venue Plan</TabsTrigger>
            <TabsTrigger value="outdoor" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">3D Outdoor Map</TabsTrigger>
          </TabsList>

        <TabsContent value="venue" className="mt-4">
          <Card className="overflow-hidden border-0 shadow-card">
            <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-primary-soft via-accent-soft to-primary-soft">
              {/* Simple stylized floor plan */}
              <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 300 400">
                <rect x="20" y="20" width="260" height="360" rx="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
                <rect x="80" y="50" width="140" height="80" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
                <rect x="40" y="180" width="100" height="60" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
                <rect x="160" y="180" width="100" height="60" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
                <rect x="100" y="250" width="100" height="50" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-success" strokeDasharray="4" />
                <rect x="40" y="290" width="80" height="50" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
              </svg>

              {HOTSPOTS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelected(h.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition active:scale-95"
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${h.tone} text-white shadow-elevated ring-2 ring-white ${selected === h.id ? "scale-125" : ""}`}>
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  <span className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${selected === h.id ? "bg-foreground text-background" : "bg-white/90 text-foreground"}`}>
                    {h.name}
                  </span>
                </button>
              ))}
            </div>
          </Card>
          {selected && (
            <Card className="mt-3 border-0 p-4 shadow-card">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected</p>
              <p className="text-lg font-bold">{HOTSPOTS.find((h) => h.id === selected)?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Inside {EVENT_CONFIG.venue.name}. Follow venue signage from the Main Lobby.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="outdoor" className="mt-4">
          <ClientOnly fallback={<div className="h-[430px] w-full rounded-2xl bg-muted/30 animate-pulse" />}>
            {() => <OsmOutdoorMap />}
          </ClientOnly>
          <Card className="mt-3 border-0 p-4 shadow-card">
            <p className="text-sm font-semibold">{EVENT_CONFIG.venue.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{EVENT_CONFIG.venue.address}</p>
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            Hotels, hospitals, ATMs and every key place live in the Maiduguri guide —
            each with tap-to-navigate directions.
          </p>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

// Lists of nearby places and hotels intentionally live in the Maiduguri
// guide (/nearby, /accommodation) — the map page shows pins only, so the
// same content never appears in two navigations.
