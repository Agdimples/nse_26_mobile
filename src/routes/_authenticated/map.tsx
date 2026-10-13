import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleOutdoorMap } from "@/components/app/GoogleOutdoorMap";
import { VenueFloorPlan, VENUE_SPACES } from "@/components/app/VenueFloorPlan";
import { EVENT_CONFIG } from "@/lib/event-config";
import { Card } from "@/components/ui/card";
import { NsePageHeader } from "@/components/app/NsePageHeader";

type Search = { room?: string };

export const Route = createFileRoute("/_authenticated/map")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    room: typeof s.room === "string" ? s.room : undefined,
  }),
  component: MapPage,
});

function MapPage() {
  const { room } = Route.useSearch();
  const [tab, setTab] = useState<"venue" | "outdoor">("venue");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (room) {
      const hit = VENUE_SPACES.find((s) => s.name === room);
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
          <VenueFloorPlan selected={selected} onSelect={setSelected} />
          {selected && (
            <Card className="mt-3 border-0 p-4 shadow-card">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected</p>
              <p className="text-lg font-bold">{VENUE_SPACES.find((s) => s.id === selected)?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Inside {EVENT_CONFIG.venue.name}. Follow venue signage from the Main Lobby.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="outdoor" className="mt-4">
          <GoogleOutdoorMap />
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
