import { createFileRoute, Link } from "@tanstack/react-router";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Navigation,
  Phone,
  BedDouble,
  ArrowUpDown,
  Search,
} from "lucide-react";
import {
  HOTELS,
  hotelMinRate,
  hotelDistanceKm,
  hasHotelPhotos,
  hotelPhotoUrl,
  type Hotel,
} from "@/lib/reference";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accommodation")({
  component: AccommodationPage,
});

type SortKey = "rank" | "nearest" | "cheapest";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "rank", label: "Ranked" },
  { key: "nearest", label: "Nearest" },
  { key: "cheapest", label: "Cheapest" },
];

const PRICE_CAPS = [20000, 35000, 60000, 100000];

const TIER_STYLES: Record<Hotel["qualityTier"], string> = {
  premier: "bg-accent-soft text-accent-foreground border-accent/30",
  standard: "bg-primary-soft text-primary-foreground border-primary/25",
  value: "bg-success-soft text-success-foreground border-success/25",
  pending: "bg-muted text-muted-foreground border-border",
};

const TIER_LABEL: Record<Hotel["qualityTier"], string> = {
  premier: "Premier",
  standard: "Standard",
  value: "Value",
  pending: "Unrated",
};

function AccommodationPage() {
  const [sort, setSort] = useState<SortKey>("rank");
  const [cap, setCap] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const hotels = useMemo(() => {
    let list = [...HOTELS];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.shortName.toLowerCase().includes(q) ||
          h.location.toLowerCase().includes(q),
      );
    }
    if (cap != null) {
      list = list.filter((h) => {
        const min = hotelMinRate(h);
        return min == null || min <= cap;
      });
    }
    switch (sort) {
      case "nearest":
        list.sort(
          (a, b) => (hotelDistanceKm(a) ?? 999) - (hotelDistanceKm(b) ?? 999),
        );
        break;
      case "cheapest":
        list.sort(
          (a, b) => (hotelMinRate(a) ?? Infinity) - (hotelMinRate(b) ?? Infinity),
        );
        break;
      default:
        list.sort((a, b) => a.rank - b.rank);
    }
    return list;
  }, [sort, cap, query]);

  return (
    <div className="pb-16">
      <NsePageHeader
        title="Accommodation"
        subtitle={`${HOTELS.length} delegate hotels · official masterlist`}
        backTo="/home"
      >
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" asChild className="h-7 text-xs bg-white/20 text-white hover:bg-white/30 border-0">
            <Link to="/map">
              <MapPin className="mr-1 h-3 w-3" /> 3D Map
            </Link>
          </Button>
          <Badge variant="secondary" className="shrink-0 bg-white/15 text-white hover:bg-white/15">
            <BedDouble className="mr-1 h-3 w-3" />
            {HOTELS.reduce((sum, h) => sum + (Number(h.roomSummary?.match(/\d+/)?.[0]) || 0), 0)}+ rooms
          </Badge>
        </div>
      </NsePageHeader>

      <div className="px-4 pt-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hotels or areas…"
          className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Sort chips */}
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex shrink-0 items-center gap-1 pr-1 text-xs text-muted-foreground">
          <ArrowUpDown className="h-3.5 w-3.5" />
        </span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              sort === s.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="w-1 shrink-0" />
        <button
          onClick={() => setCap(cap == null ? PRICE_CAPS[0] : null)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            cap != null
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface text-muted-foreground"
          }`}
        >
          {cap != null ? `Under ${formatNGN(cap)}` : "Price filter"}
        </button>
        {cap != null &&
          PRICE_CAPS.map((c) => (
            <button
              key={c}
              onClick={() => setCap(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                cap === c
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              ≤{formatNGN(c)}
            </button>
          ))}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Showing {hotels.length} of {HOTELS.length}
      </p>

      <div className="mt-3 space-y-4">
        {hotels.map((h) => (
          <HotelCard key={h.id} hotel={h} />
        ))}
        {hotels.length === 0 && (
          <Card className="border-0 p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              No hotels match — clear the price filter or search.
            </p>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const minRate = hotelMinRate(hotel);
  const distKm = hotelDistanceKm(hotel);
  const hasPhotos = hasHotelPhotos(hotel);
  const mapsUrl =
    hotel.latitude != null && hotel.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${hotel.name}, ${hotel.location}`,
        )}`;

  return (
    <Card className="overflow-hidden border-0 p-0 shadow-card">
      {hasPhotos ? (
        <img
          src={hotelPhotoUrl(hotel)}
          alt={hotel.name}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center bg-gradient-to-br from-primary-soft via-accent-soft to-primary-soft">
          <span className="text-2xl font-black tracking-tight text-primary/70">
            {hotel.shortName}
          </span>
        </div>
      )}
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {hotel.rank}
              </span>
              <h3 className="truncate text-base font-semibold leading-tight">
                {hotel.name}
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{hotel.tone}</p>
          </div>
          <Badge variant="outline" className={`shrink-0 text-[10px] ${TIER_STYLES[hotel.qualityTier]}`}>
            {TIER_LABEL[hotel.qualityTier]}
          </Badge>
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground">{hotel.location}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {distKm != null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {distKm} km from venue
            </span>
          )}
          {hotel.roomSummary && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3 w-3" /> {hotel.roomSummary.replace(/ \(sheet\)/, "")}
            </span>
          )}
          {minRate != null && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star className="h-3 w-3 fill-accent text-accent" /> from {formatNGN(minRate)}
            </span>
          )}
          {minRate == null && (
            <span className="text-xs italic text-muted-foreground">Rates pending</span>
          )}
        </div>

        {hotel.rooms.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-primary">
              Room rates ({hotel.rooms.length})
            </summary>
            <div className="mt-2 space-y-1 rounded-lg bg-surface p-2">
              {hotel.rooms.map((r) => (
                <div key={r.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-medium">{r.rate}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="flex gap-2 pt-1">
          {hotel.contactPhone && (
            <Button size="sm" variant="outline" asChild className="flex-1">
              <a href={`tel:${hotel.contactPhone.replace(/\s+/g, "")}`}>
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            </Button>
          )}
          <Button size="sm" asChild className="flex-1">
            <Link
              to="/directions"
              search={{
                lat: hotel.latitude ?? undefined,
                lng: hotel.longitude ?? undefined,
                name: hotel.name,
              }}
            >
              <Navigation className="h-3.5 w-3.5 mr-1" /> Directions
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
