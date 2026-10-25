import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useGoogleMaps, DEFAULT_MAP_CENTER } from "@/lib/google-maps";
import { VENUE_DATA, HOTELS, hotelMinRate, hotelDistanceKm, type Hotel } from "@/lib/reference";
import { formatNGN } from "@/lib/format";
import { EVENT_CONFIG } from "@/lib/event-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  RotateCw,
  RotateCcw,
  Layers,
  Navigation,
  Phone,
  Building2,
  X,
  Maximize2,
  AlertTriangle,
  MapPin,
  Utensils,
  ShieldCheck,
  HeartPulse,
  Plane,
  Hotel as HotelIcon,
  Star,
} from "lucide-react";

type FilterCategory = "all" | "venue" | "hotels" | "hospitals" | "security" | "airport" | "food";

const CATEGORY_COLORS: Record<string, string> = {
  Venue: "#123E73",
  Hotel: "#C9A227",
  Hospital: "#1E8E3E",
  Airport: "#4A90D9",
  Security: "#C0392B",
  Restaurant: "#E67E22",
  ATM: "#123E73",
  Government: "#123E73",
  Culture: "#C9A227",
};

const FILTER_TABS: { id: FilterCategory; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <MapPin className="h-3 w-3" /> },
  { id: "venue", label: "Venue", icon: <Building2 className="h-3 w-3" /> },
  { id: "hotels", label: "Hotels", icon: <HotelIcon className="h-3 w-3" /> },
  { id: "hospitals", label: "Medical", icon: <HeartPulse className="h-3 w-3" /> },
  { id: "security", label: "Security", icon: <ShieldCheck className="h-3 w-3" /> },
  { id: "airport", label: "Airport", icon: <Plane className="h-3 w-3" /> },
  { id: "food", label: "Dining", icon: <Utensils className="h-3 w-3" /> },
];

function buildVenuePin(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    display:flex; flex-direction:column; align-items:center; cursor:pointer;
    filter: drop-shadow(0 4px 8px rgba(18,62,115,0.5));
    animation: pinDrop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  `;

  const circle = document.createElement("div");
  circle.style.cssText = `
    width:44px; height:44px; border-radius:50%;
    background:linear-gradient(135deg,#1a4f8e 0%,#123E73 100%);
    border:3px solid #fff;
    display:flex; align-items:center; justify-content:center;
    font-size:20px; box-shadow:0 2px 12px rgba(18,62,115,0.45);
  `;
  circle.textContent = "📍";

  const tail = document.createElement("div");
  tail.style.cssText = `
    width:0; height:0; margin-top:-2px;
    border-left:8px solid transparent; border-right:8px solid transparent;
    border-top:10px solid #123E73;
  `;

  const label = document.createElement("div");
  label.style.cssText = `
    margin-top:4px; background:#123E73; color:#fff;
    font-size:10px; font-weight:700; letter-spacing:0.5px;
    padding:2px 7px; border-radius:20px;
    white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3);
  `;
  label.textContent = "ICC Maiduguri";

  wrapper.appendChild(circle);
  wrapper.appendChild(tail);
  wrapper.appendChild(label);
  return wrapper;
}

function buildCategoryPin(color: string, emoji: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    display:flex; flex-direction:column; align-items:center; cursor:pointer;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  `;

  const circle = document.createElement("div");
  circle.style.cssText = `
    width:30px; height:30px; border-radius:50%;
    background:${color}; border:2.5px solid #fff;
    display:flex; align-items:center; justify-content:center;
    font-size:13px; box-shadow:0 2px 8px rgba(0,0,0,0.25);
    transition: transform 0.15s ease;
  `;
  circle.textContent = emoji;

  const tail = document.createElement("div");
  tail.style.cssText = `
    width:0; height:0; margin-top:-1px;
    border-left:5px solid transparent; border-right:5px solid transparent;
    border-top:7px solid ${color};
  `;

  wrapper.appendChild(circle);
  wrapper.appendChild(tail);
  return wrapper;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Hotel: "🏨",
  Hospital: "🏥",
  Airport: "✈️",
  Security: "🛡️",
  Restaurant: "🍽️",
  ATM: "🏧",
  Government: "🏛️",
  Culture: "🎭",
};

export function GoogleOutdoorMap() {
  const { ready, authFailed, error } = useGoogleMaps();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [heading, setHeading] = useState<number>(0);
  const [tilt, setTilt] = useState<number>(0);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [initFailed, setInitFailed] = useState(false);
  const [pinCount, setPinCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    title: string;
    category: string;
    address?: string;
    lat: number;
    lng: number;
    phone?: string;
    hotel?: Hotel;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!ready || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: 13,
        tilt: 0,
        heading: 0,
        mapId: "DEMO_MAP_ID",
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        gestureHandling: "cooperative",
        // Native zoom buttons — placed at right-center so they sit below our
        // custom toolbar buttons and above the bottom pin-count badge.
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", elementType: "labels", stylers: [{ visibility: "simplified" }] },
        ],
      });

      mapInstanceRef.current = map;

      map.addListener("heading_changed", () => setHeading(Math.round(map.getHeading() || 0)));
      map.addListener("tilt_changed", () => setTilt(Math.round(map.getTilt() || 0)));
    } catch (err) {
      console.warn("[GoogleOutdoorMap] Map initialization failed:", err);
      setInitFailed(true);
    }
  }, [ready]);

  // Sync Map Type
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Populate Markers
  useEffect(() => {
    if (!ready || !mapInstanceRef.current) return;

    markersRef.current.forEach((m) => {
      if (typeof m.setMap === "function") m.setMap(null);
      else if (m.map !== undefined) m.map = null;
    });
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const useAdvanced = Boolean(window.google?.maps?.marker?.AdvancedMarkerElement);

    const itemsToMark: Array<{
      id: string;
      title: string;
      category: string;
      address?: string;
      lat: number;
      lng: number;
      phone?: string;
      hotel?: Hotel;
      isVenue?: boolean;
    }> = [];

    if (activeFilter === "all" || activeFilter === "venue") {
      itemsToMark.push({
        id: "venue-icc",
        title: EVENT_CONFIG.venue.name,
        category: "Venue",
        address: EVENT_CONFIG.venue.address,
        lat: EVENT_CONFIG.venue.latitude,
        lng: EVENT_CONFIG.venue.longitude,
        phone: EVENT_CONFIG.primaryHotline,
        isVenue: true,
      });
    }

    if (activeFilter === "all" || activeFilter === "hotels") {
      HOTELS.forEach((h) => {
        if (h.latitude && h.longitude) {
          itemsToMark.push({
            id: `hotel-${h.id}`,
            title: h.name,
            category: "Hotel",
            address: h.location,
            lat: h.latitude,
            lng: h.longitude,
            phone: h.contactPhone ?? undefined,
            hotel: h,
          });
        }
      });
    }

    VENUE_DATA.nearby.forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      const catLower = p.category.toLowerCase();
      let matches = false;
      if (activeFilter === "all") matches = true;
      else if (activeFilter === "hospitals" && catLower.includes("hospital")) matches = true;
      else if (activeFilter === "security" && catLower.includes("security")) matches = true;
      else if (activeFilter === "airport" && catLower.includes("airport")) matches = true;
      else if (activeFilter === "food" && (catLower.includes("restaurant") || catLower.includes("cafe"))) matches = true;

      if (matches) {
        itemsToMark.push({
          id: p.id,
          title: p.name,
          category: p.category,
          address: p.note,
          lat: p.latitude,
          lng: p.longitude,
          phone: p.phone,
        });
      }
    });

    setPinCount(itemsToMark.length);

    // ── Auto-fit bounds when filter changes ──────────────────────────────
    // Compute the bounding box of every visible pin and ask the map to fit
    // it.  We wait one frame so the markers are fully painted first.
    if (itemsToMark.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      itemsToMark.forEach((it) => bounds.extend({ lat: it.lat, lng: it.lng }));
      // Single-pin categories (venue-only or one result) shouldn't zoom in
      // too hard — cap at zoom 16.
      requestAnimationFrame(() => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.fitBounds(bounds, /* padding px */ 60);
        if (itemsToMark.length === 1) {
          // fitBounds on a single point can zoom to 21 — cap it
          const listener = window.google.maps.event.addListenerOnce(
            mapInstanceRef.current,
            "idle",
            () => {
              const z = mapInstanceRef.current?.getZoom() ?? 16;
              if (z > 16) mapInstanceRef.current?.setZoom(16);
            },
          );
          // Safety cleanup if idle never fires
          setTimeout(() => window.google.maps.event.removeListener(listener), 3000);
        }
      });
    }
    // ─────────────────────────────────────────────────────────────────────

    itemsToMark.forEach((item) => {
      const isVenue = Boolean(item.isVenue);
      const markerColor = isVenue ? "#123E73" : (CATEGORY_COLORS[item.category] ?? "#123E73");

      const handleClick = () => {
        setSelectedItem(item);
        // Smooth pan + zoom to selected pin
        map.panTo({ lat: item.lat, lng: item.lng });
        const currentZoom = map.getZoom() ?? 13;
        if (currentZoom < 15) {
          map.setZoom(15);
        }
      };

      if (useAdvanced) {
        const content = isVenue
          ? buildVenuePin()
          : buildCategoryPin(markerColor, CATEGORY_EMOJIS[item.category] ?? "�");

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: item.lat, lng: item.lng },
          title: item.title,
          content,
        });
        marker.addListener("click", handleClick);
        markersRef.current.push(marker);
      } else {
        const marker = new window.google.maps.Marker({
          position: { lat: item.lat, lng: item.lng },
          map,
          title: item.title,
          icon: isVenue
            ? {
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                scale: 2.2,
                fillColor: markerColor,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
                anchor: new window.google.maps.Point(12, 24),
              }
            : {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: markerColor,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2.5,
              },
        });
        marker.addListener("click", handleClick);
        markersRef.current.push(marker);
      }
    });
  }, [ready, activeFilter]);

  function toggleTilt() {
    if (!mapInstanceRef.current) return;
    const next = tilt === 0 ? 45 : 0;
    mapInstanceRef.current.setTilt(next);
    setTilt(next);
  }

  function rotateHeading(delta: number) {
    if (!mapInstanceRef.current) return;
    const next = (heading + delta + 360) % 360;
    mapInstanceRef.current.setHeading(next);
    setHeading(next);
  }

  function resetNorth() {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setHeading(0);
    setHeading(0);
  }

  function recenterVenue() {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(DEFAULT_MAP_CENTER);
    mapInstanceRef.current.setZoom(14);
    setSelectedItem(null);
  }

  if (authFailed || error || initFailed) {
    const reason =
      error ??
      (authFailed
        ? "Google rejected this API key. Enable the Maps JavaScript API and add it to the key's API restrictions."
        : "The map failed to initialise in this browser.");

    return (
      <Card className="border-0 p-6 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="mt-3 text-sm font-bold">Google Maps couldn't load</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{reason}</p>
        <Button size="sm" variant="outline" className="mt-4" asChild>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Open venue in Google Maps ↗
          </a>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Filter pills ── */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTER_TABS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setActiveFilter(f.id);
              setSelectedItem(null);
            }}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
              activeFilter === f.id
                ? "bg-primary text-white shadow-md scale-[1.04]"
                : "bg-white/80 border border-border/60 text-muted-foreground hover:bg-white hover:text-foreground shadow-sm"
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Map canvas ── */}
      <Card className="relative overflow-hidden rounded-2xl border border-border/40 shadow-xl">
        <div
          ref={mapContainerRef}
          className="w-full bg-muted/40"
          style={{ height: "420px", minHeight: "420px" }}
        />

        {/* Loading overlay */}
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="relative h-12 w-12 mb-4">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">Loading Map…</p>
            <p className="text-xs text-muted-foreground mt-1">Initialising Google Maps 3D engine</p>
          </div>
        )}

        {ready && (
          <>
            {/* ── Left controls (tilt + layers) ── */}
            <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
              <button
                onClick={toggleTilt}
                title="Toggle 3D tilt"
                className={`h-8 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg transition-all
                  ${tilt > 0
                    ? "bg-primary text-white"
                    : "bg-white/95 text-foreground backdrop-blur-sm border border-white/60"
                  }`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {tilt > 0 ? "3D" : "2D"}
              </button>

              <button
                onClick={() => setMapType((t) => (t === "roadmap" ? "hybrid" : "roadmap"))}
                title="Toggle satellite"
                className="h-8 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg bg-white/95 text-foreground backdrop-blur-sm border border-white/60 transition-all hover:bg-white"
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                {mapType === "hybrid" ? "Sat" : "Map"}
              </button>
            </div>

            {/* ── Right controls (recenter + rotate + north) ── */}
            <div className="absolute right-3 top-3 flex flex-col gap-2 z-10">
              <button
                onClick={recenterVenue}
                title="Recenter to ICC Maiduguri"
                className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg bg-white/95 text-primary backdrop-blur-sm border border-white/60 hover:bg-white transition-all"
              >
                <Building2 className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              </button>

              <button
                onClick={() => rotateHeading(-30)}
                title="Rotate left"
                className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg bg-white/95 text-foreground backdrop-blur-sm border border-white/60 hover:bg-white transition-all"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={() => rotateHeading(30)}
                title="Rotate right"
                className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg bg-white/95 text-foreground backdrop-blur-sm border border-white/60 hover:bg-white transition-all"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              {heading !== 0 && (
                <button
                  onClick={resetNorth}
                  title="Reset north"
                  className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg bg-primary text-white transition-all"
                >
                  <Compass className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* ── Pin count badge ── */}
            <div className="absolute left-3 bottom-3 z-10">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-white/50">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-semibold text-foreground">{pinCount} pins</span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── Selected info sheet ── */}
      {selectedItem ? (
        <Card className="border-0 rounded-2xl shadow-elevated overflow-hidden bg-white">
          {/* Category color stripe */}
          <div
            className="h-1 w-full"
            style={{ background: CATEGORY_COLORS[selectedItem.category] ?? "#123E73" }}
          />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5"
                    style={{
                      background: `${CATEGORY_COLORS[selectedItem.category] ?? "#123E73"}18`,
                      color: CATEGORY_COLORS[selectedItem.category] ?? "#123E73",
                      border: `1px solid ${CATEGORY_COLORS[selectedItem.category] ?? "#123E73"}30`,
                    }}
                  >
                    {selectedItem.category}
                  </Badge>
                  {selectedItem.hotel && (
                    <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                      <Star className="h-2.5 w-2.5" />
                      Rank #{selectedItem.hotel.rank}
                    </Badge>
                  )}
                </div>
                <h3 className="mt-1.5 text-base font-bold leading-snug">{selectedItem.title}</h3>
                {selectedItem.address && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {selectedItem.address}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedItem.hotel && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                {hotelMinRate(selectedItem.hotel) != null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">From</span>
                    <span className="text-sm font-bold text-primary">
                      {formatNGN(hotelMinRate(selectedItem.hotel)!)}/night
                    </span>
                  </div>
                )}
                {hotelDistanceKm(selectedItem.hotel) != null && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary" />
                    {hotelDistanceKm(selectedItem.hotel)} km to ICC
                  </div>
                )}
              </div>
            )}

            <div className="mt-3.5 flex gap-2.5">
              <Button size="sm" className="flex-1 rounded-xl font-semibold" asChild>
                <Link
                  to="/directions"
                  search={{ lat: selectedItem.lat, lng: selectedItem.lng, name: selectedItem.title }}
                >
                  <Navigation className="h-3.5 w-3.5 mr-1.5" />
                  Directions
                </Link>
              </Button>

              {selectedItem.phone && (
                <Button size="sm" variant="outline" className="rounded-xl" asChild>
                  <a href={`tel:${selectedItem.phone.replace(/\s+/g, "")}`}>
                    <Phone className="h-3.5 w-3.5 mr-1" />
                    Call
                  </a>
                </Button>
              )}

              <Button size="sm" variant="outline" className="rounded-xl" asChild>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.lat},${selectedItem.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Maps ↗
                </a>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-white/70 border border-border/40 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <span>Tap any pin to view details, rates, and get directions.</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold shrink-0 text-primary border-primary/25">
            3D
          </Badge>
        </div>
      )}
    </div>
  );
}
