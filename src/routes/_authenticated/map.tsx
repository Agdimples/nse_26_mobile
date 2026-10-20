import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleOutdoorMap } from "@/components/app/GoogleOutdoorMap";
import { IccFloorViewer } from "@/components/app/IccFloorViewer";
import { IccFloorSelector } from "@/components/app/IccFloorSelector";
import { IccRoomDetails } from "@/components/app/IccRoomDetails";
import { IccSearchBar } from "@/components/app/IccSearchBar";
import { IccSitePlan } from "@/components/app/IccSitePlan";
import { IccRoutePanel } from "@/components/app/IccRoutePanel";
import {
  ICC_FLOORS,
  floorById,
  roomById,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/data/icc-floors";
import type { IccRoom, RoomCategory } from "@/data/icc-floors";
import { EVENT_CONFIG } from "@/lib/event-config";
import { Card } from "@/components/ui/card";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { Globe, Building2, Map, Navigation } from "lucide-react";

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

type Search = {
  room?: string;
  floor?: string;
  /** Activate the polygon-capture debug overlay on the floor viewer. */
  debug?: string;
};

export const Route = createFileRoute("/_authenticated/map")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    room:  typeof s.room  === "string" ? s.room  : undefined,
    floor: typeof s.floor === "string" ? s.floor : undefined,
    debug: typeof s.debug === "string" ? s.debug : undefined,
  }),
  component: MapPage,
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type MainTab = "floors" | "site" | "outdoor" | "route";

function MapPage() {
  const { room: roomParam, floor: floorParam, debug } = Route.useSearch();
  const debugMode = debug === "1";

  const [mainTab, setMainTab] = useState<MainTab>("floors");
  const [activeFloorId, setActiveFloorId] = useState<string>(
    floorParam ?? ICC_FLOORS[0].id,
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [hoveredRoomId,  setHoveredRoomId]  = useState<string | null>(null);

  // ── Deep-link: ?room=ff-executive-lounge&floor=first ──────────────────────
  useEffect(() => {
    if (!roomParam) return;
    const r = roomById(roomParam);
    if (!r) return;
    setSelectedRoomId(r.id);
    if (r.floorId !== "site") {
      setActiveFloorId(r.floorId);
      setMainTab("floors");
    } else {
      setMainTab("site");
    }
  }, [roomParam]);

  // ── Search result selected ────────────────────────────────────────────────
  function handleSearchSelect(room: IccRoom) {
    setSelectedRoomId(room.id);
    if (room.floorId !== "site") {
      setActiveFloorId(room.floorId);
      setMainTab("floors");
    } else {
      setMainTab("site");
    }
  }

  // ── Connected-room chip / route-step tapped ───────────────────────────────
  function handleNavigateTo(roomId: string) {
    const r = roomById(roomId);
    if (!r) return;
    setSelectedRoomId(r.id);
    if (r.floorId !== "site") {
      setActiveFloorId(r.floorId);
      setMainTab("floors");
    }
  }

  /**
   * Called by IccSitePlan when the user taps the ICC building facility
   * and wants to open its floor plans. Switches the main tab to "floors"
   * and selects the ground floor.
   */
  function handleSiteOpenFloor(floorId: string) {
    setActiveFloorId(floorId);
    setSelectedRoomId(null);
    setMainTab("floors");
  }

  const activeFloor  = floorById(activeFloorId) ?? ICC_FLOORS[0];
  const selectedRoom = selectedRoomId ? (roomById(selectedRoomId) ?? null) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-28">
      <NsePageHeader
        title="Venue Map"
        subtitle={`${EVENT_CONFIG.venue.name} · Floor plans & navigation`}
        backTo="/home"
      />

      <div className="space-y-3 px-4 pt-4">
        {/* ── Main tab bar ──────────────────────────────────────────────────── */}
        <Tabs
          value={mainTab}
          onValueChange={(v) => {
            setMainTab(v as MainTab);
            setSelectedRoomId(null);
          }}
        >
          <TabsList className="grid w-full grid-cols-4 rounded-xl bg-muted/60 p-1">
            <TabsTrigger
              value="floors"
              className="flex items-center gap-1 rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Floor Plans</span>
              <span className="sm:hidden">Floors</span>
            </TabsTrigger>
            <TabsTrigger
              value="site"
              className="flex items-center gap-1 rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Map className="h-3.5 w-3.5" />
              Site
            </TabsTrigger>
            <TabsTrigger
              value="route"
              className="flex items-center gap-1 rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Navigation className="h-3.5 w-3.5" />
              Route
            </TabsTrigger>
            <TabsTrigger
              value="outdoor"
              className="flex items-center gap-1 rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Globe className="h-3.5 w-3.5" />
              Outdoor
            </TabsTrigger>
          </TabsList>

          {/* ── Floor plans ─────────────────────────────────────────────────── */}
          <TabsContent value="floors" className="mt-3 space-y-3">
            <IccSearchBar onSelectRoom={handleSearchSelect} />

            <IccFloorSelector
              floors={ICC_FLOORS}
              activeFloorId={activeFloorId}
              onSelect={(id) => {
                setActiveFloorId(id);
                setSelectedRoomId(null);
              }}
            />

            <IccFloorViewer
              floor={activeFloor}
              selectedRoomId={selectedRoomId}
              hoveredRoomId={hoveredRoomId}
              onSelectRoom={(id) =>
                setSelectedRoomId((prev) => (prev === id ? null : id))
              }
              onHoverRoom={setHoveredRoomId}
              height={440}
              debugMode={debugMode}
            />

            {selectedRoom && selectedRoom.floorId !== "site" && (
              <IccRoomDetails
                room={selectedRoom}
                onClose={() => setSelectedRoomId(null)}
                onNavigateTo={handleNavigateTo}
              />
            )}

            <CategoryLegend />
          </TabsContent>

          {/* ── Site plan ───────────────────────────────────────────────────── */}
          <TabsContent value="site" className="mt-3">
            <IccSitePlan onOpenFloor={handleSiteOpenFloor} />
          </TabsContent>

          {/* ── Indoor routing ──────────────────────────────────────────────── */}
          <TabsContent value="route" className="mt-3">
            <IccRoutePanel
              activeRoomId={selectedRoomId}
              onNavigateStep={handleNavigateTo}
            />
          </TabsContent>

          {/* ── Outdoor map ─────────────────────────────────────────────────── */}
          <TabsContent value="outdoor" className="mt-3 space-y-3">
            <GoogleOutdoorMap />
            <Card className="border-0 p-4 shadow-card">
              <p className="text-sm font-semibold">{EVENT_CONFIG.venue.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {EVENT_CONFIG.venue.address}
              </p>
            </Card>
            <p className="text-xs text-muted-foreground">
              Hotels, hospitals, ATMs and every key place live in the Maiduguri
              guide — each with tap-to-navigate directions.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category legend
// ---------------------------------------------------------------------------

const LEGEND_CATEGORIES: RoomCategory[] = [
  "auditorium",
  "seminar",
  "meeting",
  "lounge",
  "office",
  "media",
  "reception",
  "gallery",
  "circulation",
  "service",
  "open",
];

function CategoryLegend() {
  return (
    <div className="rounded-2xl border border-border bg-white p-3 shadow-card">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Legend
      </p>
      <div className="flex flex-wrap gap-1.5">
        {LEGEND_CATEGORIES.map((cat) => {
          const c = CATEGORY_COLORS[cat];
          return (
            <span
              key={cat}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: c.fill,
                color: c.text,
                border: `1px solid ${c.stroke}44`,
              }}
            >
              <span className="h-2 w-2 rounded-sm" style={{ background: c.stroke }} />
              {CATEGORY_LABELS[cat]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
