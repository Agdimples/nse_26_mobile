import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
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
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  LocateFixed,
  Utensils,
  CheckCircle2,
} from "lucide-react";

// ─── Route ────────────────────────────────────────────────────────────────────

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
  return note.split(/[,·•]+/).map((s) => s.trim()).filter(Boolean).slice(0, 5);
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

  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string }>(() =>
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

  // bottom sheet state: "peek" (just summary), "half" (controls visible), "full" (all steps)
  const [sheet, setSheet] = useState<"peek" | "half" | "full">("half");

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

  useEffect(() => {
    mutate({ origin, mode });
  }, [origin, mode, dest]);

  function locate() {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported"); return; }
    setGeoError(null);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "My GPS Location" });
        setSelectedOriginPreset("custom");
      },
      (err) => { setGeoLoading(false); setGeoError(`Location: ${err.message}`); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleOriginPresetChange(val: string) {
    setSelectedOriginPreset(val);
    if (val === "venue") {
      setOrigin({ lat: EVENT_CONFIG.venue.latitude, lng: EVENT_CONFIG.venue.longitude, label: EVENT_CONFIG.venue.name });
    } else if (val.startsWith("hotel-")) {
      const hotel = HOTELS.find((h) => h.id === val.replace("hotel-", ""));
      if (hotel?.latitude && hotel?.longitude)
        setOrigin({ lat: hotel.latitude, lng: hotel.longitude, label: hotel.name });
    }
  }

  const hotelPresets = HOTELS.filter((h) => h.latitude != null && h.longitude != null).slice(0, 10);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=${mode === "DRIVE" ? "driving" : "walking"}`;
  const specialties = note ? parseSpecialties(note) : [];
  const durationMin = route ? Math.max(1, Math.round(route.durationSeconds / 60)) : null;
  const distanceKm = route ? (route.distanceMeters / 1000).toFixed(1) : null;

  // Sheet height classes
  const sheetHeight = sheet === "peek" ? "h-[120px]" : sheet === "half" ? "h-[52vh]" : "h-[88vh]";

  return (
    /* Full-viewport container — no scroll on this level */
    <div className="fixed inset-0 flex flex-col bg-background">

      {/* ── Full-screen map ────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <ClientOnly fallback={
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          {() => (
            <DirectionsInteractiveMap
              dest={dest}
              origin={origin}
              encodedPolyline={route?.encodedPolyline}
            />
          )}
        </ClientOnly>
      </div>

      {/* ── Floating top bar ──────────────────────────────────────── */}
      <div className="relative z-20 flex items-center gap-3 px-4 pt-12 pb-3 pointer-events-none">
        {/* Back button */}
        <Link
          to="/nearby"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition hover:bg-white active:scale-95"
          aria-label="Back to Nearby"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </Link>

        {/* Destination pill */}
        <div className="pointer-events-auto flex-1 flex items-center gap-2.5 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Utensils className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground leading-tight">{dest.name}</p>
            {address && (
              <p className="truncate text-[11px] text-muted-foreground leading-tight">{address}</p>
            )}
          </div>
          {/* Route badge */}
          {durationMin && distanceKm && (
            <div className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-2.5 py-1">
              <Clock className="h-3 w-3 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground">{durationMin} min</span>
              <span className="text-[10px] text-primary-foreground/70">· {distanceKm} km</span>
            </div>
          )}
          {isPending && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* ── Floating right-side action buttons ───────────────────── */}
      <div className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex flex-col gap-2.5">
        {/* Phone */}
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition hover:bg-white active:scale-95"
            aria-label={`Call ${name}`}
          >
            <Phone className="h-5 w-5 text-emerald-600" />
          </a>
        )}
        {/* Open in Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition hover:bg-white active:scale-95"
          aria-label="Open in Google Maps"
        >
          <ExternalLink className="h-5 w-5 text-primary" />
        </a>
        {/* GPS locate */}
        <button
          onClick={locate}
          disabled={geoLoading}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition hover:bg-white active:scale-95 disabled:opacity-60"
          aria-label="Use my GPS location"
        >
          {geoLoading
            ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
            : <LocateFixed className="h-5 w-5 text-primary" />
          }
        </button>
      </div>

      {/* ── Bottom sheet ──────────────────────────────────────────── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 flex flex-col rounded-t-3xl bg-white/98 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out ${sheetHeight}`}
        style={{ willChange: "height" }}
      >
        {/* Drag handle + sheet toggle */}
        <button
          onClick={() => setSheet(sheet === "peek" ? "half" : sheet === "half" ? "full" : "peek")}
          className="flex w-full flex-col items-center gap-1 pt-3 pb-2"
          aria-label="Toggle panel"
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {sheet === "full" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            {sheet === "full" ? "Collapse" : "Expand"}
          </div>
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {/* ── Travel mode + route summary row ──────────────── */}
          <div className="flex items-center gap-3">
            {/* Mode pills */}
            <div className="flex gap-1.5 rounded-2xl bg-muted p-1">
              {(["DRIVE", "WALK"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    mode === m
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "DRIVE"
                    ? <Car className="h-4 w-4" />
                    : <Footprints className="h-4 w-4" />
                  }
                  {m === "DRIVE" ? "Drive" : "Walk"}
                </button>
              ))}
            </div>

            {/* Stats */}
            {route && durationMin && distanceKm && (
              <div className="flex flex-1 items-center justify-end gap-4">
                <div className="text-center">
                  <p className="text-xl font-extrabold leading-none text-foreground">{durationMin}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">min</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-xl font-extrabold leading-none text-foreground">{distanceKm}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">km</p>
                </div>
              </div>
            )}
            {isPending && (
              <div className="flex flex-1 items-center justify-end gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Routing…
              </div>
            )}
          </div>

          {/* ── Starting point selector ───────────────────── */}
          <div className="rounded-2xl border border-border bg-background px-3 py-1">
            <div className="flex items-center gap-2 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
              <select
                value={selectedOriginPreset}
                onChange={(e) => handleOriginPresetChange(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none"
              >
                <option value="venue">📍 International Conference Centre</option>
                <optgroup label="Delegate Hotels">
                  {hotelPresets.map((h) => (
                    <option key={h.id} value={`hotel-${h.id}`}>🏨 {h.name}</option>
                  ))}
                </optgroup>
                {selectedOriginPreset === "custom" && (
                  <option value="custom">📍 My GPS Location</option>
                )}
              </select>
            </div>
            <div className="mx-9 my-0.5 h-px bg-border" />
            <div className="flex items-center gap-2 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <p className="flex-1 truncate text-sm font-medium text-foreground">{dest.name}</p>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="text-xs font-semibold text-emerald-600"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          {geoError && <p className="text-xs text-destructive">{geoError}</p>}

          {/* ── Specialty tags ────────────────────────────── */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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

          {/* ── Open in Google Maps CTA ───────────────────── */}
          {route && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-90 active:scale-[0.98]"
            >
              <Navigation className="h-4 w-4" />
              Start Navigation in Google Maps
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          )}

          {/* ── Turn-by-turn steps ────────────────────────── */}
          {route && route.steps.length > 0 && (
            <div className="rounded-2xl border border-border bg-background">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Turn-by-turn
                </p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {route.steps.length} steps
                </span>
              </div>
              <ol>
                {route.steps.map((step, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      i < route.steps.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    {/* Step number */}
                    <div className="flex flex-col items-center pt-0.5">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        i === 0
                          ? "bg-primary text-primary-foreground"
                          : i === route.steps.length - 1
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {i === route.steps.length - 1 ? "✓" : i + 1}
                      </span>
                      {i < route.steps.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 16 }} />
                      )}
                    </div>
                    {/* Instruction */}
                    <div className="flex-1 pb-1 pt-0.5">
                      <div
                        className="text-sm leading-snug text-foreground [&>b]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: step.instruction }}
                      />
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {(step.distanceMeters / 1000).toFixed(1)} km
                        {step.durationText ? ` · ${step.durationText}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
