import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useGoogleMaps, DEFAULT_MAP_CENTER } from "@/lib/google-maps";
import { VENUE_DATA, HOTELS, hotelMinRate, hotelDistanceKm, type Hotel } from "@/lib/reference";
import { formatNGN } from "@/lib/format";
import { EVENT_CONFIG } from "@/lib/event-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientOnly } from "./ClientOnly";
import {
  Compass,
  RotateCw,
  RotateCcw,
  Layers,
  Navigation,
  Phone,
  Building2,
  X,
  Eye,
} from "lucide-react";

const LazyOsmOutdoorMap = lazy(() => import("./OsmOutdoorMap"));

type FilterCategory = "all" | "venue" | "hotels" | "hospitals" | "security" | "airport" | "food";

const CATEGORY_COLORS: Record<string, string> = {
  Venue: "#123E73",
  Hotel: "#C9A227",
  Hospital: "#1E8E3E",
  Airport: "#123E73",
  Security: "#C0392B",
  Restaurant: "#E67E22",
  ATM: "#123E73",
  Government: "#123E73",
  Culture: "#C9A227",
};

export function GoogleOutdoorMap() {
  const { ready, authFailed, error } = useGoogleMaps();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [tilt, setTilt] = useState<number>(45);
  const [heading, setHeading] = useState<number>(0);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [initFailed, setInitFailed] = useState(false);
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

  // If Google Maps fails authentication (e.g. Firebase App Check enforcement on Google Cloud)
  // or script loading fails, immediately render the interactive OSM & Satellite map via client-only lazy load.
  if (authFailed || error || initFailed) {
    return (
      <ClientOnly fallback={<div className="h-[430px] w-full rounded-2xl bg-muted/30 animate-pulse" />}>
        {() => (
          <Suspense fallback={<div className="h-[430px] w-full rounded-2xl bg-muted/30 animate-pulse" />}>
            <LazyOsmOutdoorMap />
          </Suspense>
        )}
      </ClientOnly>
    );
  }

  // Initialize Map
  useEffect(() => {
    if (!ready || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: 14,
        tilt: 45,
        heading: 0,
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      });

      mapInstanceRef.current = map;

      map.addListener("heading_changed", () => {
        setHeading(Math.round(map.getHeading() || 0));
      });
      map.addListener("tilt_changed", () => {
        setTilt(Math.round(map.getTilt() || 0));
      });
    } catch (err) {
      console.warn("[GoogleOutdoorMap] Map initialization failed, activating fallback:", err);
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

    // Clear previous markers
    markersRef.current.forEach((m) => {
      if (typeof m.setMap === "function") m.setMap(null);
      else if (m.map) m.map = null;
    });
    markersRef.current = [];

    const map = mapInstanceRef.current;
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
            phone: h.contactPhone,
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

    itemsToMark.forEach((item) => {
      const isVenue = Boolean(item.isVenue);
      const markerColor = isVenue ? "#123E73" : CATEGORY_COLORS[item.category] ?? "#123E73";

      // Modern AdvancedMarkerElement when available
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        const pinElement = document.createElement("div");
        pinElement.style.display = "flex";
        pinElement.style.alignItems = "center";
        pinElement.style.justifyContent = "center";
        pinElement.style.width = isVenue ? "32px" : "24px";
        pinElement.style.height = isVenue ? "32px" : "24px";
        pinElement.style.borderRadius = "9999px";
        pinElement.style.backgroundColor = markerColor;
        pinElement.style.border = isVenue ? "3px solid #ffffff" : "2px solid #ffffff";
        pinElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
        pinElement.style.color = "#ffffff";
        pinElement.style.fontSize = isVenue ? "16px" : "11px";
        pinElement.style.cursor = "pointer";
        pinElement.innerText = isVenue ? "📍" : "•";

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: item.lat, lng: item.lng },
          title: item.title,
          content: pinElement,
        });

        marker.addListener("click", () => {
          setSelectedItem(item);
          map.panTo({ lat: item.lat, lng: item.lng });
        });

        markersRef.current.push(marker);
      } else {
        const marker = new window.google.maps.Marker({
          position: { lat: item.lat, lng: item.lng },
          map,
          title: item.title,
          icon: {
            path: isVenue
              ? "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              : window.google.maps.SymbolPath.CIRCLE,
            scale: isVenue ? 1.8 : 7,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
            anchor: isVenue ? new window.google.maps.Point(12, 22) : undefined,
          },
        });

        marker.addListener("click", () => {
          setSelectedItem(item);
          map.panTo({ lat: item.lat, lng: item.lng });
        });

        markersRef.current.push(marker);
      }
    });
  }, [ready, activeFilter]);

  // Camera Tilt Handler
  function toggleTilt() {
    if (!mapInstanceRef.current) return;
    const nextTilt = tilt === 0 ? 45 : 0;
    if (mapType === "roadmap") {
      mapInstanceRef.current.setTilt(nextTilt);
    }
    setTilt(nextTilt);
  }

  // Camera Rotate Clockwise
  function rotateHeading(delta: number) {
    if (!mapInstanceRef.current) return;
    const nextHeading = (heading + delta + 360) % 360;
    mapInstanceRef.current.setHeading(nextHeading);
    setHeading(nextHeading);
  }

  // Reset to North
  function resetNorth() {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setHeading(0);
    setHeading(0);
  }

  // Recenter to Venue
  function recenterVenue() {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(DEFAULT_MAP_CENTER);
    mapInstanceRef.current.setZoom(15);
  }

  return (
    <div className="space-y-3">
      {/* Category filter pills */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "all", label: "All Pins" },
          { id: "venue", label: "Venue (ICC)" },
          { id: "hotels", label: "Hotels (47)" },
          { id: "hospitals", label: "Medical" },
          { id: "security", label: "Security" },
          { id: "airport", label: "Airport" },
          { id: "food", label: "Dining" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id as FilterCategory)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
              activeFilter === f.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map Card */}
      <Card className="relative overflow-hidden border-0 shadow-elevated">
        <div
          ref={mapContainerRef}
          className="h-[390px] w-full bg-muted/40 transition duration-300"
          style={{ minHeight: "390px" }}
        />

        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-sm p-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
            <p className="text-sm font-semibold">Loading 3D Google Map…</p>
            <p className="text-xs text-muted-foreground mt-1">Connecting to Google Maps 3D vector engine</p>
          </div>
        )}

        {/* 3D & Camera Control Toolbar overlay */}
        {ready && (
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
            {/* 3D Tilt toggle button */}
            <Button
              size="sm"
              variant={tilt > 0 ? "default" : "secondary"}
              onClick={toggleTilt}
              className="h-8 px-2.5 text-xs font-bold shadow-md gap-1.5 backdrop-blur-md"
              title="Toggle 3D Tilt"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{tilt > 0 ? "3D Tilt" : "2D Flat"}</span>
            </Button>

            {/* Satellite / Hybrid toggle */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setMapType((t) => (t === "roadmap" ? "hybrid" : "roadmap"))}
              className="h-8 px-2 text-xs font-medium shadow-md gap-1 bg-white/95 text-foreground hover:bg-white"
              title="Toggle Satellite Imagery"
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>{mapType === "hybrid" ? "Satellite" : "Map"}</span>
            </Button>
          </div>
        )}

        {/* Rotation & Recenter Controls overlay (Top Right) */}
        {ready && (
          <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-10">
            {/* Recenter Venue */}
            <Button
              size="icon"
              variant="secondary"
              onClick={recenterVenue}
              className="h-8 w-8 rounded-full bg-white/95 text-foreground shadow-md hover:bg-white"
              title="Recenter to ICC Maiduguri"
            >
              <Building2 className="h-4 w-4 text-primary" />
            </Button>

            {/* Rotate Left */}
            <Button
              size="icon"
              variant="secondary"
              onClick={() => rotateHeading(-30)}
              className="h-8 w-8 rounded-full bg-white/95 text-foreground shadow-md hover:bg-white"
              title="Rotate Left"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {/* Rotate Right */}
            <Button
              size="icon"
              variant="secondary"
              onClick={() => rotateHeading(30)}
              className="h-8 w-8 rounded-full bg-white/95 text-foreground shadow-md hover:bg-white"
              title="Rotate Right"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>

            {/* North Reset Compass */}
            {heading !== 0 && (
              <Button
                size="icon"
                variant="default"
                onClick={resetNorth}
                className="h-8 w-8 rounded-full shadow-md bg-accent text-accent-foreground"
                title="Reset to True North"
              >
                <Compass className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Selected Location Card */}
      {selectedItem ? (
        <Card className="border-0 p-4 shadow-card bg-surface transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/25">
                  {selectedItem.category}
                </Badge>
                {selectedItem.hotel && (
                  <Badge variant="secondary" className="text-[10px]">
                    Rank #{selectedItem.hotel.rank}
                  </Badge>
                )}
              </div>
              <h3 className="mt-1 text-base font-bold leading-tight truncate">{selectedItem.title}</h3>
              {selectedItem.address && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{selectedItem.address}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedItem.hotel && (
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {hotelMinRate(selectedItem.hotel) != null && (
                <span className="font-semibold text-foreground">
                  From {formatNGN(hotelMinRate(selectedItem.hotel)!)}/night
                </span>
              )}
              {hotelDistanceKm(selectedItem.hotel) != null && (
                <span>📍 {hotelDistanceKm(selectedItem.hotel)} km to ICC</span>
              )}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button size="sm" asChild className="flex-1">
              <Link
                to="/directions"
                search={{
                  lat: selectedItem.lat,
                  lng: selectedItem.lng,
                  name: selectedItem.title,
                }}
              >
                <Navigation className="h-3.5 w-3.5 mr-1" /> Live Directions
              </Link>
            </Button>

            {selectedItem.phone && (
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${selectedItem.phone.replace(/\s+/g, "")}`}>
                  <Phone className="h-3.5 w-3.5 mr-1" /> Call
                </a>
              </Button>
            )}

            <Button size="sm" variant="outline" asChild>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.lat},${selectedItem.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Maps ↗
              </a>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-0 p-3.5 shadow-card bg-surface/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Compass className="h-4 w-4 text-primary shrink-0" />
            <span>Tap any pin to view details, rates, and launch 3D directions.</span>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 font-medium text-primary">
            3D Vector
          </Badge>
        </Card>
      )}
    </div>
  );
}
