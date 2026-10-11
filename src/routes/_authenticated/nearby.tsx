import { createFileRoute, Link } from "@tanstack/react-router";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  { icon: typeof Shield; tint: string }
> = {
  Airport: { icon: Plane, tint: "bg-primary-soft text-primary-foreground" },
  Security: { icon: Shield, tint: "bg-destructive-soft text-destructive-foreground" },
  Government: { icon: Landmark, tint: "bg-primary-soft text-primary-foreground" },
  Culture: { icon: Church, tint: "bg-accent-soft text-accent-foreground" },
  Hospital: { icon: Cross, tint: "bg-success-soft text-success-foreground" },
  Restaurant: { icon: Utensils, tint: "bg-accent-soft text-accent-foreground" },
  Pharmacy: { icon: Pill, tint: "bg-success-soft text-success-foreground" },
  ATM: { icon: Banknote, tint: "bg-primary-soft text-primary-foreground" },
  Shopping: { icon: ShoppingBag, tint: "bg-accent-soft text-accent-foreground" },
  "Spouses visit": { icon: Users, tint: "bg-accent-soft text-accent-foreground" },
};

function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? { icon: MapPin, tint: "bg-muted text-muted-foreground" };
}

function NearbyPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const pois = VENUE_DATA.nearby.filter((p) => {
      const matchesQuery =
        !query.trim() ||
        p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        (p.note ?? "").toLowerCase().includes(query.trim().toLowerCase());
      const matchesCat = active == null || p.category === active;
      return matchesQuery && matchesCat;
    });
    const map = new Map<string, NearbyPoi[]>();
    for (const poi of pois) {
      const list = map.get(poi.category) ?? [];
      list.push(poi);
      map.set(poi.category, list);
    }
    // Order groups by the canonical category order
    return POI_CATEGORY_ORDER.filter((c) => map.has(c)).map(
      (c) => [c, map.get(c)!] as const,
    );
  }, [query, active]);

  const total = VENUE_DATA.nearby.length;
  const shown = grouped.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div className="pb-16">
      <NsePageHeader
        title="Nearby"
        subtitle={`${total} key places around ${VENUE_DATA.venue.shortName}`}
        backTo="/home"
      >
        <Button size="sm" variant="secondary" asChild className="h-7 text-xs bg-white/20 text-white hover:bg-white/30 border-0">
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
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActive(null)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            active == null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-muted-foreground"
          }`}
        >
          All
        </button>
        {POI_CATEGORY_ORDER.map((c) => {
          const { icon: Icon } = categoryMeta(c);
          return (
            <button
              key={c}
              onClick={() => setActive(active === c ? null : c)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
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

      <div className="mt-3 space-y-5">
        {grouped.map(([category, pois]) => {
          const { icon: Icon, tint } = categoryMeta(category);
          return (
            <section key={category}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${tint}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  {category}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({pois.length})
                </span>
              </div>
              <div className="space-y-2.5">
                {pois.map((poi) => (
                  <PoiCard key={poi.id} poi={poi} />
                ))}
              </div>
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
    <Card className="border-0 p-3.5 shadow-card">
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
