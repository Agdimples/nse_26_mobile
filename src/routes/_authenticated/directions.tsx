import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { useGoogleMaps } from "@/lib/google-maps";
import { EVENT_CONFIG } from "@/lib/event-config";
import { HOTELS } from "@/lib/reference";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDirections } from "@/lib/maps.functions";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Footprints,
  Car,
  Navigation,
  Eye,
  Layers,
} from "lucide-react";

type Search = { lat?: number; lng?: number; name?: string };

export const Route = createFileRoute("/_authenticated/directions")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    lat: typeof s.lat === "number" ? s.lat : s.lat ? Number(s.lat) : undefined,
    lng: typeof s.lng === "number" ? s.lng : s.lng ? Number(s.lng) : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
  }),
  component: DirectionsPage,
});

export function DirectionsPage() {
  const { lat, lng, name } = Route.useSearch();
  const navigate = useNavigate();
  const { ready, authFailed } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string }>({
    lat: EVENT_CONFIG.venue.latitude,
    lng: EVENT_CONFIG.venue.longitude,
    label: "Maiduguri (Center)",
  });
  const [selectedOriginPreset, setSelectedOriginPreset] = useState<string>("venue");
  const [mode, setMode] = useState<"WALK" | "DRIVE">("DRIVE");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [tilt, setTilt] = useState<number>(45);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");

  const dest = useMemo(
    () =>
      lat != null && lng != null
        ? { lat, lng, name: name ?? "Destination" }
        : {
            lat: EVENT_CONFIG.venue.latitude,
            lng: EVENT_CONFIG.venue.longitude,
            name: EVENT_CONFIG.venue.name,
          },
    [lat, lng, name],
  );

  const dirFn = useServerFn(getDirections);
  const { data: route, mutate, isPending } = useMutation({
    mutationFn: async (vars: { origin: { lat: number; lng: number }; mode: "WALK" | "DRIVE" }) =>
      dirFn({
        data: {
          originLat: vars.origin.lat,
          originLng: vars.origin.lng,
          destLat: dest.lat,
          destLng: dest.lng,
          travelMode: vars.mode,
        },
      }),
  });

  // Calculate route on mount or changes
  useEffect(() => {
    mutate({ origin, mode });
  }, [origin, mode, dest]);

  // GPS Locate User
  function locate() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "My GPS Location",
        };
        setOrigin(loc);
        setSelectedOriginPreset("custom");
      },
      (err) => setGeoError(`Location access: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Preset Origin Selection
  function handleOriginPresetChange(val: string) {
    setSelectedOriginPreset(val);
    if (val === "venue") {
      const loc = {
        lat: EVENT_CONFIG.venue.latitude,
        lng: EVENT_CONFIG.venue.longitude,
        label: EVENT_CONFIG.venue.name,
      };
      setOrigin(loc);
    } else if (val.startsWith("hotel-")) {
      const hotelId = val.replace("hotel-", "");
      const hotel = HOTELS.find((h) => h.id === hotelId);
      if (hotel?.latitude && hotel?.longitude) {
        const loc = {
          lat: hotel.latitude,
          lng: hotel.longitude,
          label: hotel.name,
        };
        setOrigin(loc);
      }
    }
  }

  // Initialize Google Map only when ready and no auth failure
  useEffect(() => {
    if (!ready || authFailed || !mapRef.current) return;

    if (!mapInstance.current) {
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: dest.lat, lng: dest.lng },
          zoom: 14,
          tilt: 45,
          mapId: "DEMO_MAP_ID",
          mapTypeId: "roadmap",
          disableDefaultUI: true,
          zoomControl: true,
        });

        mapInstance.current = map;
      } catch (e) {
        console.warn("[DirectionsPage] Google Map init error:", e);
      }
    } else {
      mapInstance.current.panTo({ lat: dest.lat, lng: dest.lng });
    }
  }, [ready, authFailed, dest]);

  // Sync Map Type
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Sync Tilt
  useEffect(() => {
    if (mapInstance.current) {
      if (mapType === "roadmap") {
        mapInstance.current.setTilt(tilt);
      }
    }
  }, [tilt, mapType]);

  // Draw Google Map Route & Markers
  useEffect(() => {
    if (!ready || authFailed || !mapInstance.current) return;
    const map = mapInstance.current;

    // Clear old markers
    markersRef.current.forEach((m) => {
      if (typeof m.setMap === "function") m.setMap(null);
      else m.map = null;
    });
    markersRef.current = [];

    // Clear old polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Destination Marker
    if (window.google.maps.marker?.AdvancedMarkerElement) {
      const pin = document.createElement("div");
      pin.style.display = "flex";
      pin.style.alignItems = "center";
      pin.style.justifyContent = "center";
      pin.style.width = "34px";
      pin.style.height = "34px";
      pin.style.borderRadius = "9999px";
      pin.style.backgroundColor = "#C9A227";
      pin.style.border = "3px solid #ffffff";
      pin.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
      pin.style.fontSize = "16px";
      pin.innerText = "📍";
      const destMarker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: dest.lat, lng: dest.lng },
        map,
        title: dest.name,
        content: pin,
      });
      markersRef.current.push(destMarker);
    } else {
      const destMarker = new window.google.maps.Marker({
        position: { lat: dest.lat, lng: dest.lng },
        map,
        title: dest.name,
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          scale: 1.6,
          fillColor: "#C9A227",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          anchor: new window.google.maps.Point(12, 22),
        },
      });
      markersRef.current.push(destMarker);
    }

    // Origin Marker
    if (origin) {
      if (window.google.maps.marker?.AdvancedMarkerElement) {
        const pin = document.createElement("div");
        pin.style.width = "18px";
        pin.style.height = "18px";
        pin.style.borderRadius = "9999px";
        pin.style.backgroundColor = "#123E73";
        pin.style.border = "2.5px solid #ffffff";
        pin.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
        const originMarker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: origin.lat, lng: origin.lng },
          map,
          title: origin.label,
          content: pin,
        });
        markersRef.current.push(originMarker);
      } else {
        const originMarker = new window.google.maps.Marker({
          position: { lat: origin.lat, lng: origin.lng },
          map,
          title: origin.label,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#123E73",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
          },
        });
        markersRef.current.push(originMarker);
      }
    }

    // Draw Route Polyline
    if (route?.encodedPolyline && window.google.maps.geometry?.encoding) {
      const path = window.google.maps.geometry.encoding.decodePath(route.encodedPolyline);
      const line = new window.google.maps.Polyline({
        path,
        strokeColor: "#123E73",
        strokeWeight: 5.5,
        strokeOpacity: 0.9,
      });
      line.setMap(map);
      polylineRef.current = line;

      // Fit bounds
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: dest.lat, lng: dest.lng });
      bounds.extend({ lat: origin.lat, lng: origin.lng });
      map.fitBounds(bounds, 60);
    }
  }, [ready, authFailed, route, dest, origin]);

  const hotelPresets = HOTELS.filter((h) => h.latitude != null && h.longitude != null).slice(0, 10);

  const googleMapsAppUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=${mode === "DRIVE" ? "driving" : "walking"}`;

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Live Directions"
        subtitle={`To: ${dest.name}`}
        backTo="/home"
      />

      <div className="px-4 pt-4 space-y-3">
        {/* Origin Selector Card */}
        <Card className="border-0 p-3.5 shadow-card bg-surface space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
            <span>Starting Point</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs text-primary font-medium"
              onClick={locate}
            >
              <Navigation className="h-3 w-3 mr-1" /> Use GPS
            </Button>
          </div>

          <select
            value={selectedOriginPreset}
            onChange={(e) => handleOriginPresetChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring outline-none"
          >
            <option value="venue">📍 International Conference Centre (ICC)</option>
            <optgroup label="Delegate Hotels">
              {hotelPresets.map((h) => (
                <option key={h.id} value={`hotel-${h.id}`}>
                  🏨 {h.name} ({h.location})
                </option>
              ))}
            </optgroup>
            {selectedOriginPreset === "custom" && (
              <option value="custom">📍 My GPS Location</option>
            )}
          </select>

          {geoError && <p className="text-xs text-destructive">{geoError}</p>}
        </Card>

        {/* Travel Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "DRIVE" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("DRIVE")}
          >
            <Car className="h-4 w-4 mr-1.5" /> Drive
          </Button>
          <Button
            variant={mode === "WALK" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("WALK")}
          >
            <Footprints className="h-4 w-4 mr-1.5" /> Walk
          </Button>
        </div>

        {/* Map Container: 3D Google Vector Map */}
        <Card className="relative overflow-hidden border-0 shadow-elevated">
          <div ref={mapRef} className="aspect-[4/3] w-full bg-muted" />

          {/* Loading Shimmer while Google Maps script initializes */}
          {!ready && !authFailed && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-muted/80 backdrop-blur-sm">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="mt-2 text-xs font-semibold text-foreground">Loading 3D Google Map…</p>
            </div>
          )}

          {/* Connection / Auth Fallback */}
          {authFailed && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-inner">
                <Navigation className="h-6 w-6" />
              </div>
              <p className="mt-2 text-sm font-bold text-foreground">Route Details</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {origin.label} → {dest.name}
              </p>
              <Button size="sm" asChild className="mt-3 shadow">
                <a href={googleMapsAppUrl} target="_blank" rel="noreferrer">
                  Open Google Maps App ↗
                </a>
              </Button>
            </div>
          )}

          {/* 3D Map Controls Toolbar (when ready) */}
          {ready && !authFailed && (
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
              <Button
                size="sm"
                variant={tilt > 0 ? "default" : "secondary"}
                onClick={() => setTilt((t) => (t === 0 ? 45 : 0))}
                className="h-8 px-2.5 text-xs font-bold shadow-md gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{tilt > 0 ? "3D Tilt" : "2D"}</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setMapType((t) => (t === "roadmap" ? "hybrid" : "roadmap"))}
                className="h-8 px-2 text-xs font-medium shadow-md gap-1 bg-white/95 text-foreground"
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>{mapType === "hybrid" ? "Satellite" : "Map"}</span>
              </Button>
            </div>
          )}
        </Card>

        {/* Loading Spinner */}
        {isPending && (
          <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Calculating optimal route…
          </div>
        )}

        {/* Route Stats & Steps */}
        {route && (
          <Card className="border-0 p-4 shadow-card bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.max(1, Math.round(route.durationSeconds / 60))} min
                </p>
                <p className="text-xs text-muted-foreground">
                  {(route.distanceMeters / 1000).toFixed(1)} km · via Maiduguri Network
                </p>
              </div>
              <a
                href={googleMapsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Open in Google Maps ↗
              </a>
            </div>

            {/* Turn by turn steps */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Turn-by-turn directions ({route.steps.length} steps)
              </p>
              <div className="space-y-2">
                {route.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="flex-1 pt-0.5">
                      <div
                        className="text-foreground leading-snug [&>b]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: step.instruction }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {(step.distanceMeters / 1000).toFixed(1)} km
                        {step.durationText ? ` · ${step.durationText}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
