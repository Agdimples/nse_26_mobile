import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Shield,
  Landmark,
  Church,
  Cross,
  Utensils,
  Pill,
  Banknote,
  ShoppingBag,
  Users,
  Navigation,
  Phone,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  VENUE_DATA,
  POI_CATEGORY_ORDER,
  haversineKm,
  type NearbyPoi,
} from "@/lib/reference";

export const Route = createFileRoute("/_authenticated/nearby")({
  component: NearbyPage,
});

const CATEGORY_META: Record<
  string,
  { icon: typeof Shield; tint: string; chip: string; chipActive: string }
> = {
  Airport:       { icon: Plane,      tint: "bg-sky-100 text-sky-700",         chip: "border-sky-200 bg-sky-50 text-sky-700",              chipActive: "border-sky-500 bg-sky-500 text-white"         },
  Security:      { icon: Shield,     tint: "bg-red-100 text-red-700",          chip: "border-red-200 bg-red-50 text-red-700",              chipActive: "border-red-500 bg-red-500 text-white"         },
  Restaurant:    { icon: Utensils,   tint: "bg-amber-100 text-amber-700",      chip: "border-amber-200 bg-amber-50 text-amber-700",        chipActive: "border-amber-500 bg-amber-500 text-white"     },
  Government:    { icon: Landmark,   tint: "bg-blue-100 text-blue-700",        chip: "border-blue-200 bg-blue-50 text-blue-700",           chipActive: "border-blue-600 bg-blue-600 text-white"       },
  Culture:       { icon: Church,     tint: "bg-purple-100 text-purple-700",    chip: "border-purple-200 bg-purple-50 text-purple-700",     chipActive: "border-purple-600 bg-purple-600 text-white"   },
  Hospital:      { icon: Cross,      tint: "bg-emerald-100 text-emerald-700",  chip: "border-emerald-200 bg-emerald-50 text-emerald-700",  chipActive: "border-emerald-600 bg-emerald-600 text-white" },
  Pharmacy:      { icon: Pill,       tint: "bg-teal-100 text-teal-700",        chip: "border-teal-200 bg-teal-50 text-teal-700",           chipActive: "border-teal-600 bg-teal-600 text-white"       },
  ATM:           { icon: Banknote,   tint: "bg-green-100 text-green-700",      chip: "border-green-200 bg-green-50 text-green-700",        chipActive: "border-green-600 bg-green-600 text-white"     },
  Shopping:      { icon: ShoppingBag,tint: "bg-orange-100 text-orange-700",    chip: "border-orange-200 bg-orange-50 text-orange-700",     chipActive: "border-orange-500 bg-orange-500 text-white"   },
  "Spouses visit":{ icon: Users,     tint: "bg-pink-100 text-pink-700",        chip: "border-pink-200 bg-pink-50 text-pink-700",           chipActive: "border-pink-500 bg-pink-500 text-white"       },
};

function categoryMeta(category: string) {
  return (
    CATEGORY_META[category] ?? {
      icon: MapPin,
      tint: "bg-muted text-muted-foreground",
      chip: "border-border bg-surface text-muted-foreground",
      chipActive: "border-primary bg-primary text-primary-foreground",
    }
  );
}

/** Parse comma-separated note into individual specialty tags */
function parseSpecialties(note: string): string[] {
  return note
    .split(/[,·•]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5); // max 5 tags shown
}

/** Build image URLs for a restaurant from its imageFolder and imageCount */
function buildImageUrls(folder: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return `${folder}/${num}.webp`;
  });
}

// ─── Restaurant Image Carousel (manual navigation) ───────────────────────────

function RestaurantCard({ poi }: { poi: NearbyPoi }) {
  const images = poi.imageFolder
    ? buildImageUrls(poi.imageFolder, poi.imageCount ?? 1)
    : [];

  const [idx, setIdx] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const validImages = images.filter((_, i) => !imgErrors.has(i));
  const total = validImages.length;
  const safeIdx = total > 0 ? idx % total : 0;

  const goTo = useCallback((i: number) => setIdx((i + total) % total), [total]);
  const prev = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); goTo(safeIdx - 1); },
    [goTo, safeIdx],
  );
  const next = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); goTo(safeIdx + 1); },
    [goTo, safeIdx],
  );

  const specialties = poi.note ? parseSpecialties(poi.note) : [];

  function handleDirections(e: React.MouseEvent) {
    e.stopPropagation();
    navigate({
      to: "/directions",
      search: {
        lat: poi.latitude ?? undefined,
        lng: poi.longitude ?? undefined,
        name: poi.name,
        address: poi.address,
        phone: poi.phone,
        note: poi.note,
      },
    });
  }

  return (
    <Card className="overflow-hidden border-0 bg-surface shadow-card transition-shadow hover:shadow-md rounded-2xl">
      {/* ── Photo gallery ─────────────────────────────────── */}
      <div
        className="relative h-52 overflow-hidden bg-amber-50"
      >
        {total === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Utensils className="h-12 w-12 text-amber-200" />
          </div>
        ) : (
          <>
            {/* Image with crossfade */}
            <img
              key={validImages[safeIdx]}
              src={validImages[safeIdx]}
              alt={`${poi.name} photo ${safeIdx + 1}`}
              className="h-full w-full object-cover animate-in fade-in duration-500"
              onError={() =>
                setImgErrors((prev) => {
                  const s = new Set(prev);
                  s.add(images.indexOf(validImages[safeIdx]));
                  return s;
                })
              }
            />

            {/* Deep gradient: transparent top → rich dark bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* ── Bottom info panel ────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5 pt-2">
              {/* Name row */}
              <div className="flex items-end justify-between gap-2">
                <h4 className="text-[15px] font-bold leading-tight text-white drop-shadow">
                  {poi.name}
                </h4>
                {/* Directions button */}
                <button
                  onClick={handleDirections}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow transition hover:bg-amber-600 active:scale-95"
                  aria-label={`Directions to ${poi.name}`}
                >
                  <Navigation className="h-3 w-3" />
                  Directions
                </button>
              </div>

              {/* Address */}
              {poi.address && (
                <div className="mt-1 flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" />
                  <p className="line-clamp-1 text-[11px] leading-relaxed text-white/80">
                    {poi.address}
                  </p>
                </div>
              )}

              {/* Phone + dot indicators row */}
              <div className="mt-1.5 flex items-center justify-between gap-2">
                {poi.phone ? (
                  <a
                    href={`tel:${poi.phone.replace(/\s+/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
                  >
                    <Phone className="h-3 w-3" />
                    {poi.phone}
                  </a>
                ) : (
                  <span />
                )}

                {/* Dot indicators */}
                {total > 1 && total <= 15 && (
                  <div className="flex items-center gap-1">
                    {validImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); goTo(i); }}
                        className={`rounded-full transition-all ${
                          i === safeIdx
                            ? "h-1.5 w-4 bg-amber-400"
                            : "h-1.5 w-1.5 bg-white/40"
                        }`}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
                {total > 15 && (
                  <span className="text-[10px] text-white/60">
                    {safeIdx + 1}/{total}
                  </span>
                )}
              </div>
            </div>

            {/* Prev / Next arrows */}
            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/55"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/55"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Specialty tags below image ─────────────────────── */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
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
    </Card>
  );
}

// ─── Airport Card (image banner + details) ────────────────────────────────────

function AirportCard({ poi }: { poi: NearbyPoi }) {
  const navigate = useNavigate();

  function handleDirections(e: React.MouseEvent) {
    e.stopPropagation();
    navigate({
      to: "/directions",
      search: {
        lat: poi.latitude ?? undefined,
        lng: poi.longitude ?? undefined,
        name: poi.name,
      },
    });
  }

  return (
    <Card className="overflow-hidden border-0 bg-surface shadow-card transition-shadow hover:shadow-md rounded-2xl">
      {/* ── Image banner ─────────────────────────────────────── */}
      <div className="relative h-44 w-full overflow-hidden bg-sky-100">
        {poi.image ? (
          <img
            src={poi.image}
            alt={poi.name}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Plane className="h-14 w-14 text-sky-200" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* IATA badge top-left */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
          <Plane className="h-3.5 w-3.5 text-sky-300" />
          <span className="text-[11px] font-bold tracking-widest text-sky-200 uppercase">
            MIU
          </span>
        </div>

        {/* Distance badge top-right */}
        {poi.distanceKm != null && (
          <div className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
            <span className="text-[11px] font-semibold text-white">
              {poi.distanceKm} km
            </span>
          </div>
        )}

        {/* Bottom overlay: name + directions button */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-2 px-4 pb-3.5 pt-2">
          <div className="min-w-0">
            <h4 className="text-[15px] font-bold leading-tight text-white drop-shadow">
              {poi.name}
            </h4>
            {poi.note && (
              <p className="mt-0.5 text-[11px] text-sky-200/90">{poi.note}</p>
            )}
          </div>
          <button
            onClick={handleDirections}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg transition hover:bg-sky-600 active:scale-95"
            aria-label={`Directions to ${poi.name}`}
          >
            <Navigation className="h-3.5 w-3.5" />
            Directions
          </button>
        </div>
      </div>

      {/* ── Info row below image ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-500" />
          <span>~45 min from ICC · Airport Road</span>
        </div>
        {poi.phone && (
          <a
            href={`tel:${poi.phone.replace(/\s+/g, "")}`}
            className="flex items-center gap-1 text-[12px] font-semibold text-primary"
          >
            <Phone className="h-3.5 w-3.5" />
            {poi.phone}
          </a>
        )}
      </div>
    </Card>
  );
}

// ─── Culture Card (image banner + details) ───────────────────────────────────

function CultureCard({ poi }: { poi: NearbyPoi }) {
  const label = (poi as any).highlight ?? "CULTURE";

  return (
    <Card className="overflow-hidden border-0 bg-surface shadow-card transition-shadow hover:shadow-md rounded-2xl">
      {/* ── Image banner ─────────────────────────────────────── */}
      <div className="relative h-44 w-full overflow-hidden bg-purple-50">
        {poi.image ? (
          <img
            src={poi.image}
            alt={poi.name}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Church className="h-12 w-12 text-purple-200" />
          </div>
        )}

        {/* Rich gradient: strong at bottom, soft at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {/* Heritage badge top-left */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-sm">
          <Church className="h-3 w-3 text-purple-300" />
          <span className="text-[10px] font-bold tracking-widest text-purple-200 uppercase">
            {label}
          </span>
        </div>

        {/* Distance badge top-right */}
        {poi.distanceKm != null && (
          <div className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-sm">
            <span className="text-[11px] font-semibold text-white">
              {poi.distanceKm} km
            </span>
          </div>
        )}

        {/* Bottom overlay: name + directions */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-2 px-4 pb-3.5 pt-2">
          <div className="min-w-0">
            <h4 className="text-[15px] font-bold leading-tight text-white drop-shadow line-clamp-1">
              {poi.name}
            </h4>
            {poi.note && (
              <p className="mt-0.5 text-[11px] text-purple-200/90 line-clamp-1">
                {poi.note}
              </p>
            )}
          </div>
          <Link
            to="/directions"
            search={{
              lat: poi.latitude ?? undefined,
              lng: poi.longitude ?? undefined,
              name: poi.name,
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg transition hover:bg-purple-700 active:scale-95"
          >
            <Navigation className="h-3.5 w-3.5" />
            Directions
          </Link>
        </div>
      </div>

      {/* ── Info row below image ──────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-500" />
        <span className="text-[13px] text-muted-foreground">
          {poi.distance} from ICC
        </span>
      </div>
    </Card>
  );
}

// ─── Government Card (image banner + details) ────────────────────────────────

function GovernmentCard({ poi }: { poi: NearbyPoi }) {
  const label = poi.name.toLowerCase().includes("borno")
    ? "BORNO STATE"
    : poi.name.toLowerCase().includes("lagos")
    ? "LAGOS STATE"
    : poi.name.toLowerCase().includes("yobe")
    ? "YOBE STATE"
    : "GOVT";

  return (
    <Card className="overflow-hidden border-0 bg-surface shadow-card transition-shadow hover:shadow-md rounded-2xl">
      {/* ── Image banner ─────────────────────────────────────── */}
      <div className="relative h-36 w-full overflow-hidden bg-blue-50">
        {poi.image ? (
          <img
            src={poi.image}
            alt={poi.name}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Landmark className="h-12 w-12 text-blue-200" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* State label badge top-left */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-sm">
          <Landmark className="h-3 w-3 text-blue-300" />
          <span className="text-[10px] font-bold tracking-widest text-blue-200 uppercase">
            {label}
          </span>
        </div>

        {/* Distance badge top-right */}
        {poi.distanceKm != null && (
          <div className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-sm">
            <span className="text-[11px] font-semibold text-white">
              {poi.distanceKm} km
            </span>
          </div>
        )}

        {/* Bottom overlay: name + note */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-2">
          <h4 className="text-[14px] font-bold leading-tight text-white drop-shadow line-clamp-1">
            {poi.name}
          </h4>
          {poi.note && (
            <p className="mt-0.5 text-[11px] text-blue-200/90 line-clamp-1">
              {poi.note}
            </p>
          )}
        </div>
      </div>

      {/* ── Info row below image ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <span className="text-[13px] text-muted-foreground truncate">
            {poi.distance} from ICC
          </span>
        </div>
        <Link
          to="/directions"
          search={{
            lat: poi.latitude ?? undefined,
            lng: poi.longitude ?? undefined,
            name: poi.name,
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow transition hover:bg-blue-700 active:scale-95"
        >
          <Navigation className="h-3 w-3" />
          Directions
        </Link>
      </div>
    </Card>
  );
}

// ─── Security Card (image banner + details) ──────────────────────────────────

function SecurityCard({ poi }: { poi: NearbyPoi }) {
  // Decide icon label: Army vs Police vs other
  const isArmy =
    poi.name.toLowerCase().includes("army") ||
    poi.name.toLowerCase().includes("cantonment") ||
    poi.name.toLowerCase().includes("barracks");
  const isPolice =
    poi.name.toLowerCase().includes("police");

  const typeLabel = isArmy ? "ARMY" : isPolice ? "POLICE" : "SECURITY";

  return (
    <Card className="overflow-hidden border-0 bg-surface shadow-card transition-shadow hover:shadow-md rounded-2xl">
      {/* ── Image banner ─────────────────────────────────────── */}
      <div className="relative h-36 w-full overflow-hidden bg-red-50">
        {poi.image ? (
          <img
            src={poi.image}
            alt={poi.name}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shield className="h-12 w-12 text-red-200" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Type badge top-left */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-sm">
          <Shield className="h-3 w-3 text-red-300" />
          <span className="text-[10px] font-bold tracking-widest text-red-200 uppercase">
            {typeLabel}
          </span>
        </div>

        {/* Distance badge top-right */}
        {poi.distanceKm != null && (
          <div className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-sm">
            <span className="text-[11px] font-semibold text-white">
              {poi.distanceKm} km
            </span>
          </div>
        )}

        {/* Bottom overlay: name + note */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-2">
          <h4 className="text-[14px] font-bold leading-tight text-white drop-shadow line-clamp-1">
            {poi.name}
          </h4>
          {poi.note && (
            <p className="mt-0.5 text-[11px] text-red-200/90 line-clamp-1">{poi.note}</p>
          )}
        </div>
      </div>

      {/* ── Info row below image ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <span className="text-[13px] text-muted-foreground truncate">{poi.distance} from ICC</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {poi.phone && (
            <a
              href={`tel:${poi.phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Phone className="h-3 w-3" />
              Call
            </a>
          )}
          <Link
            to="/directions"
            search={{
              lat: poi.latitude ?? undefined,
              lng: poi.longitude ?? undefined,
              name: poi.name,
            }}
            className="flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow transition hover:bg-red-700 active:scale-95"
          >
            <Navigation className="h-3 w-3" />
            Directions
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ─── Generic POI Card (non-restaurant) ───────────────────────────────────────

function PoiCard({ poi }: { poi: NearbyPoi }) {
  const { icon: Icon, tint } = categoryMeta(poi.category);
  const liveKm =
    poi.latitude != null && poi.longitude != null
      ? haversineKm(
          VENUE_DATA.venue.latitude,
          VENUE_DATA.venue.longitude,
          poi.latitude,
          poi.longitude,
        )
      : null;
  const mapsUrl =
    poi.latitude != null && poi.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${poi.query ?? poi.name}, Maiduguri`,
        )}`;

  return (
    <Card className="border-0 bg-surface rounded-2xl p-4 shadow-card transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tint}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold leading-tight">{poi.name}</h4>
          {poi.note && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {poi.note}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {(liveKm ?? poi.distanceKm) != null && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {(liveKm ?? poi.distanceKm)!.toFixed(1)} km
              </span>
            )}
            {poi.phone && (
              <a
                href={`tel:${poi.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1 font-medium text-primary"
              >
                <Phone className="h-3 w-3" /> {poi.phone}
              </a>
            )}
          </div>
        </div>
        <Button size="sm" variant="outline" asChild className="shrink-0">
          <Link
            to="/directions"
            search={{
              lat: poi.latitude ?? undefined,
              lng: poi.longitude ?? undefined,
              name: poi.name,
            }}
            aria-label={`Directions to ${poi.name}`}
          >
            <Navigation className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function NearbyPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const pois = VENUE_DATA.nearby.filter((p) => {
      const matchesQuery =
        !query.trim() ||
        p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        (p.note ?? "").toLowerCase().includes(query.trim().toLowerCase()) ||
        (p.address ?? "").toLowerCase().includes(query.trim().toLowerCase());
      const matchesCat = active == null || p.category === active;
      return matchesQuery && matchesCat;
    });
    const map = new Map<string, NearbyPoi[]>();
    for (const poi of pois) {
      const list = map.get(poi.category) ?? [];
      list.push(poi);
      map.set(poi.category, list);
    }
    return POI_CATEGORY_ORDER.filter((c) => map.has(c)).map(
      (c) => [c, map.get(c)!] as const,
    );
  }, [query, active]);

  const total = VENUE_DATA.nearby.length;
  const shown = grouped.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Nearby"
        subtitle={`${total} key places around ${VENUE_DATA.venue.shortName}`}
        backTo="/home"
      >
        <Button
          size="sm"
          variant="secondary"
          asChild
          className="h-7 text-xs bg-white/20 text-white hover:bg-white/30 border-0"
        >
          <Link to="/map">
            <MapPin className="mr-1 h-3 w-3" /> 3D Map
          </Link>
        </Button>
      </NsePageHeader>

      <div className="px-4 pt-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category chips */}
        <div className="-mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* All chip */}
          <button
            onClick={() => setActive(null)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95 ${
              active == null
                ? "border-primary bg-primary text-primary-foreground shadow-md"
                : "border-border bg-surface text-foreground hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                active == null ? "bg-white/25" : "bg-muted"
              }`}
            >
              ✦
            </span>
            All
          </button>

          {POI_CATEGORY_ORDER.map((c) => {
            const { icon: Icon, chip, chipActive } = categoryMeta(c);
            const isActive = active === c;
            return (
              <button
                key={c}
                onClick={() => setActive(isActive ? null : c)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95 ${
                  isActive ? `${chipActive} shadow-md` : `${chip} hover:opacity-80`
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    isActive ? "bg-white/25" : "bg-white/80"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </span>
                {c}
              </button>
            );
          })}
        </div>

        {shown !== total && (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing {shown} of {total}
          </p>
        )}

        <div className="mt-4 space-y-6">
          {grouped.map(([category, pois]) => {
            const { icon: Icon, tint } = categoryMeta(category);
            const isRestaurant = category === "Restaurant";

            return (
              <section key={category}>
                {/* Section header */}
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${tint}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest">
                    {category}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {pois.length}
                  </span>
                </div>

                {isRestaurant ? (
                  /* Restaurant grid */
                  <div className="grid grid-cols-1 gap-4">
                    {pois.map((poi) => (
                      <RestaurantCard key={poi.id} poi={poi} />
                    ))}
                  </div>
                ) : category === "Airport" ? (
                  /* Airport card with image banner */
                  <div className="space-y-3">
                    {pois.map((poi) => (
                      <AirportCard key={poi.id} poi={poi} />
                    ))}
                  </div>
                ) : category === "Security" ? (
                  /* Security cards with image banner */
                  <div className="space-y-3">
                    {pois.map((poi) => (
                      <SecurityCard key={poi.id} poi={poi} />
                    ))}
                  </div>
                ) : category === "Government" ? (
                  /* Government cards with image banner */
                  <div className="space-y-3">
                    {pois.map((poi) => (
                      <GovernmentCard key={poi.id} poi={poi} />
                    ))}
                  </div>
                ) : category === "Culture" ? (
                  /* Culture cards with image banner */
                  <div className="space-y-3">
                    {pois.map((poi) => (
                      <CultureCard key={poi.id} poi={poi} />
                    ))}
                  </div>
                ) : (
                  /* Regular POI list */
                  <div className="space-y-2.5">
                    {pois.map((poi) => (
                      <PoiCard key={poi.id} poi={poi} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {grouped.length === 0 && (
            <Card className="border-0 p-8 text-center shadow-card">
              <p className="text-sm text-muted-foreground">No places match.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
