import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { EVENT_CONFIG } from "@/lib/event-config";
import { HOTELS } from "@/lib/reference";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDirections } from "@/lib/maps.functions";
import { DirectionsInteractiveMap } from "@/components/app/DirectionsInteractiveMap";
import { ClientOnly } from "@/components/app/ClientOnly";
import {
  Loader2,
  Footprints,
  Car,
  Navigation,
  MapPin,
  Phone,
  Clock,
  Route as RouteIcon,
  ExternalLink,
  ChevronRight,
  LocateFixed,
  Utensils,
} from "lucide-react";

type Search = {
  lat?: number;
  lng?: number;
  name?: string;
  address?: string;
  phone?: string;
  note?: string;
};

export const Route = createFileRoute("/_authenticated/directions")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    lat: typeof s.lat === "number" ? s.lat : s.lat ? Number(s.lat) : undefined,
    lng: typeof s.lng === "number" ? s.lng : s.lng ? Number(s.lng) : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
    address: typeof s.address === "string" ? s.address : undefined,
    phone: typeof s.phone === "string" ? s.phone : undefined,
    note: typeof s.note === "string" ? s.note : undefined,
  }),
  component: DirectionsPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSpecialties(note: string): string[] {
  return note
    .split(/[,·•]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function TravelModeBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "bg-surface text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DirectionsPage() {
  const { lat, lng, name, address, phone, note } = Route.useSearch();

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

  const isDestVenue =
    Math.abs(dest.lat - EVENT_CONFIG.venue.latitude) < 0.0001 &&
    Math.abs(dest.lng - EVENT_CONFIG.venue.longitude) < 0.0001;

  const defaultHotel = HOTELS[0];

  const [origin, setOrigin] = useState<{
    lat: number;
    lng: number;
    label: string;
  }>(() =>
    isDestVenue
      ? {
          lat: defaultHotel.latitude ?? EVENT_CONFIG.venue.latitude,
          lng: defaultHotel.longitude ?? EVENT_CONFIG.venue.longitude,
          label: defaultHotel.name,
        }
      : {
          lat: EVENT_CONFIG.venue.latitude,
          lng: EVENT_CONFIG.venue.longitude,
          label: EVENT_CONFIG.venue.name,
        },
  );

  const [selectedOriginPreset, setSelectedOriginPreset] = useState<string>(
    isDestVenue ? `hotel-${defaultHotel.id}` : "venue",
  );
  const [mode, setMode] = useState<"WALK" | "DRIVE">("DRIVE");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const dirFn = useServerFn(getDirections);
  const {
    data: route,
    mutate,
    isPending,
  } = useMutation({
    mutationFn: async (vars: {
      origin: { lat: number; lng: number };
      mode: "WALK" | "DRIVE";
    }) =>
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

  useEffect(() => {
    mutate({ origin, mode });
  }, [origin, mode, dest]);

  function locate() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    setGeoError(null);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "My GPS Location",
        });
        setSelectedOriginPreset("custom");
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(`Location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleOriginPresetChange(val: string) {
    setSelectedOriginPreset(val);
    if (val === "venue") {
      setOrigin({
        lat: EVENT_CONFIG.venue.latitude,
        lng: EVENT_CONFIG.venue.longitude,
        label: EVENT_CONFIG.venue.name,
      });
    } else if (val.startsWith("hotel-")) {
      const hotel = HOTELS.find((h) => h.id === val.replace("hotel-", ""));
      if (hotel?.latitude && hotel?.longitude) {
        setOrigin({
          lat: hotel.latitude,
          lng: hotel.longitude,
          label: hotel.name,
        });
      }
    }
  }

  const hotelPresets = HOTELS.filter(
    (h) => h.latitude != null && h.longitude != null,
  ).slice(0, 10);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=${mode === "DRIVE" ? "driving" : "walking"}`;

  const specialties = note ? parseSpecialties(note) : [];
  const durationMin = route
    ? Math.max(1, Math.round(route.durationSeconds / 60))
    : null;
  const distanceKm = route
    ? (route.distanceMeters / 1000).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      <NsePageHeader
        title="Directions"
        subtitle={dest.name}
        backTo="/nearby"
      />

      {/* ── Responsive layout: single col mobile, side-by-side on md+ ── */}
      <div className="mx-auto max-w-6xl px-4 pt-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">

          {/* ── Left panel (controls + destination info) ─────────────── */}
          <div className="flex flex-col gap-4 md:w-80 md:shrink-0">

            {/* Destination card */}
            <div className="rounded-2xl border-0 bg-surface p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Utensils className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold leading-tight text-foreground">
                    {dest.name}
                  </h2>
                  {address && (
                    <div className="mt-1 flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {address}
                      </p>
                    </div>
                  )}
                  {phone && (
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {phone}
                    </a>
                  )}
                </div>
              </div>

              {specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {specialties.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Route summary card — shows when route is loaded */}
            {(route || isPending) && (
              <div className="rounded-2xl border-0 bg-surface p-4 shadow-card">
                {isPending ? (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Calculating route…
                  </div>
                ) : route ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-extrabold text-foreground">
                          {durationMin}
                          <span className="ml-0.5 text-sm font-medium text-muted-foreground">
                            min
                          </span>
                        </span>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex items-center gap-2">
                        <RouteIcon className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-extrabold text-foreground">
                          {distanceKm}
                          <span className="ml-0.5 text-sm font-medium text-muted-foreground">
                            km
                          </span>
                        </span>
                      </div>
                    </div>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 active:scale-[0.98]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Google Maps
                    </a>
                  </>
                ) : null}
              </div>
            )}

            {/* Starting point */}
            <div className="rounded-2xl border-0 bg-surface p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Starting Point
                </p>
                <button
                  onClick={locate}
                  disabled={geoLoading}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-60"
                >
                  {geoLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <LocateFixed className="h-3 w-3" />
                  )}
                  Use GPS
                </button>
              </div>

              <select
                value={selectedOriginPreset}
                onChange={(e) => handleOriginPresetChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="venue">📍 International Conference Centre</option>
                <optgroup label="Delegate Hotels">
                  {hotelPresets.map((h) => (
                    <option key={h.id} value={`hotel-${h.id}`}>
                      🏨 {h.name}
                    </option>
                  ))}
                </optgroup>
                {selectedOriginPreset === "custom" && (
                  <option value="custom">📍 My GPS Location</option>
                )}
              </select>

              {geoError && (
                <p className="mt-2 text-xs text-destructive">{geoError}</p>
              )}
            </div>

            {/* Travel mode */}
            <div className="flex gap-2 rounded-2xl border-0 bg-surface p-2 shadow-card">
              <TravelModeBtn
                active={mode === "DRIVE"}
                icon={<Car className="h-4 w-4" />}
                label="Drive"
                onClick={() => setMode("DRIVE")}
              />
              <TravelModeBtn
                active={mode === "WALK"}
                icon={<Footprints className="h-4 w-4" />}
                label="Walk"
                onClick={() => setMode("WALK")}
              />
            </div>
          </div>

          {/* ── Right panel (map + steps) ─────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">

            {/* Map */}
            <div className="overflow-hidden rounded-2xl shadow-card md:sticky md:top-4">
              <ClientOnly
                fallback={
                  <div className="aspect-[4/3] w-full animate-pulse bg-muted/40 md:aspect-video" />
                }
              >
                {() => (
                  <div className="aspect-[4/3] md:aspect-video">
                    <DirectionsInteractiveMap
                      dest={dest}
                      origin={origin}
                      encodedPolyline={route?.encodedPolyline}
                    />
                  </div>
                )}
              </ClientOnly>
            </div>

            {/* Turn-by-turn steps */}
            {route && route.steps.length > 0 && (
              <div className="rounded-2xl border-0 bg-surface p-4 shadow-card">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Turn-by-turn · {route.steps.length} steps
                </p>
                <ol className="space-y-0">
                  {route.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 py-2.5">
                      {/* Step connector */}
                      <div className="flex flex-col items-center">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {i + 1}
                        </span>
                        {i < route.steps.length - 1 && (
                          <div className="mt-1 h-full w-px flex-1 bg-border" style={{ minHeight: 12 }} />
                        )}
                      </div>
                      <div className="flex-1 pb-0.5 pt-0.5">
                        <div
                          className="text-xs leading-relaxed text-foreground [&>b]:font-semibold"
                          dangerouslySetInnerHTML={{ __html: step.instruction }}
                        />
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          {(step.distanceMeters / 1000).toFixed(1)} km
                          {step.durationText ? ` · ${step.durationText}` : ""}
                        </span>
                      </div>
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
