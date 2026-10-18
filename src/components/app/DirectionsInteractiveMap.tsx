import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, Maximize2, AlertTriangle, Loader2 } from "lucide-react";
import { useGoogleMaps } from "@/lib/google-maps";

interface DirectionsInteractiveMapProps {
  dest: { lat: number; lng: number; name: string };
  origin?: { lat: number; lng: number; label: string };
  encodedPolyline?: string;
}

// Minimal shape of the Google Maps objects we touch, so we don't need `any`.
type LatLngLiteral = { lat: number; lng: number };
type GMap = {
  setMapTypeId: (t: string) => void;
  fitBounds: (b: unknown, padding?: number) => void;
};
type GMapsOverlay = { setMap: (m: unknown) => void };

// Decode Google encoded polyline to [{ lat, lng }, ...]
function decodePolyline(encoded: string): LatLngLiteral[] {
  if (!encoded) return [];
  const points: LatLngLiteral[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function pinElement(color: string, emoji: string, size: number) {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "9999px";
  el.style.backgroundColor = color;
  el.style.border = "3px solid #ffffff";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
  el.style.color = "#ffffff";
  el.style.fontSize = `${Math.round(size * 0.55)}px`;
  el.style.cursor = "pointer";
  el.innerText = emoji;
  return el;
}

/**
 * Interactive Google Maps (vector) route map — no Leaflet, no raster tiles.
 * Falls back to nothing but an explicit error state if the Maps JS API cannot
 * load; there is deliberately no second map provider.
 */
export function DirectionsInteractiveMap({
  dest,
  origin,
  encodedPolyline,
}: DirectionsInteractiveMapProps) {
  const { ready, authFailed, error } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const overlaysRef = useRef<GMapsOverlay[]>([]);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [initFailed, setInitFailed] = useState(false);

  // Initialise the map once the JS API is ready.
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    try {
      const map = new window.google.maps.Map(containerRef.current, {
        center: { lat: dest.lat, lng: dest.lng },
        zoom: 14,
        mapId: "DEMO_MAP_ID",
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      });
      mapRef.current = map;
    } catch (err) {
      console.warn("[DirectionsMap] Initialisation failed:", err);
      setInitFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Reflect the satellite/roadmap toggle.
  useEffect(() => {
    if (mapRef.current) mapRef.current.setMapTypeId(mapType);
  }, [mapType]);

  // Draw markers + route polyline whenever the route data changes.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const g = window.google.maps;
    const map = mapRef.current;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const bounds = new g.LatLngBounds();
    bounds.extend({ lat: dest.lat, lng: dest.lng });

    const applyMarker = (position: LatLngLiteral, title: string, color: string, emoji: string, size: number) => {
      if (g.marker?.AdvancedMarkerElement) {
        const marker = new g.marker.AdvancedMarkerElement({
          map,
          position,
          title,
          content: pinElement(color, emoji, size),
        });
        overlaysRef.current.push(marker);
      } else {
        const marker = new g.Marker({
          map,
          position,
          title,
          icon: {
            path: g.SymbolPath.CIRCLE,
            scale: size / 2,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
          },
        });
        overlaysRef.current.push(marker);
      }
    };

    applyMarker({ lat: dest.lat, lng: dest.lng }, dest.name, "#C9A227", "📍", 34);

    if (origin) {
      applyMarker({ lat: origin.lat, lng: origin.lng }, origin.label, "#123E73", "•", 24);
      bounds.extend({ lat: origin.lat, lng: origin.lng });
    }

    const routePoints = encodedPolyline ? decodePolyline(encodedPolyline) : [];

    if (routePoints.length > 1) {
      const line = new g.Polyline({
        path: routePoints,
        map,
        strokeColor: "#123E73",
        strokeWeight: 5,
        strokeOpacity: 0.9,
      });
      overlaysRef.current.push(line);
      routePoints.forEach((p) => bounds.extend(p));
    } else if (origin) {
      // Straight guide line when a live route polyline isn't available yet.
      const line = new g.Polyline({
        path: [
          { lat: origin.lat, lng: origin.lng },
          { lat: dest.lat, lng: dest.lng },
        ],
        map,
        strokeColor: "#123E73",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      });
      overlaysRef.current.push(line);
    }

    map.fitBounds(bounds, 48);
  }, [ready, dest.lat, dest.lng, dest.name, origin, encodedPolyline]);

  function fitRoute() {
    if (!mapRef.current) return;
    const g = window.google.maps;
    const bounds = new g.LatLngBounds();
    bounds.extend({ lat: dest.lat, lng: dest.lng });
    if (origin) bounds.extend({ lat: origin.lat, lng: origin.lng });
    (encodedPolyline ? decodePolyline(encodedPolyline) : []).forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 48);
  }

  if (authFailed || error || initFailed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/30 p-6 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <p className="text-sm font-semibold">Route map unavailable</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {error ??
            "Google Maps couldn't load this route. Check that the Maps JavaScript API is enabled for the API key."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted">
      <div ref={containerRef} className="h-full w-full" />

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs font-medium">Loading map…</span>
        </div>
      )}

      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setMapType((t) => (t === "roadmap" ? "hybrid" : "roadmap"))}
          className="h-8 gap-1 bg-white/95 px-2 text-xs font-semibold text-foreground shadow-md hover:bg-white"
        >
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>{mapType === "hybrid" ? "Satellite" : "Map"}</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={fitRoute}
          className="h-8 gap-1 bg-white/95 px-2 text-xs font-semibold text-foreground shadow-md hover:bg-white"
        >
          <Maximize2 className="h-3.5 w-3.5 text-primary" />
          <span>Fit</span>
        </Button>
      </div>
    </div>
  );
}
