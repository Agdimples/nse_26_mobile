import { createServerFn } from "@tanstack/react-start";
import { EVENT_CONFIG } from "@/lib/event-config";
import { VENUE_DATA } from "@/lib/reference";

export type Place = {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  openNow?: boolean;
  category?: string;
};

const CATEGORY_TO_GOOGLE_TYPE: Record<string, string> = {
  restaurant: "restaurant",
  cafe: "cafe",
  atm: "atm",
  pharmacy: "pharmacy",
  hospital: "hospital",
  airport: "airport",
  shopping: "shopping_mall",
  lodging: "lodging",
};

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function getMapsApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyD0YTPW3zHpu9fcZEvHKxNvAWRWdrNpmns"
  );
}

export const searchNearby = createServerFn({ method: "POST" })
  .validator((input: { category?: string; query?: string }) => {
    return {
      category: typeof input.category === "string" ? input.category.slice(0, 50) : undefined,
      query: typeof input.query === "string" ? input.query.slice(0, 100) : undefined,
    };
  })
  .handler(async ({ data }): Promise<Place[]> => {
    const mapsKey = getMapsApiKey();
    const results: Place[] = [];

    // Filter matching curated reference points around the venue
    const curatedMatches = VENUE_DATA.nearby
      .filter((p) => {
        if (!p.latitude || !p.longitude) return false;
        if (data.category && data.category !== "all") {
          if (p.category.toLowerCase() !== data.category.toLowerCase()) return false;
        }
        if (data.query) {
          const q = data.query.toLowerCase();
          return p.name.toLowerCase().includes(q) || (p.note ?? "").toLowerCase().includes(q);
        }
        return true;
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        address: p.note,
        category: p.category,
        latitude: p.latitude,
        longitude: p.longitude,
        distanceMeters:
          p.latitude && p.longitude
            ? Math.round(haversineMeters(EVENT_CONFIG.venue.latitude, EVENT_CONFIG.venue.longitude, p.latitude, p.longitude))
            : undefined,
      }));

    results.push(...curatedMatches);

    // Call live Google Places API
    try {
      const typeParam = data.category ? CATEGORY_TO_GOOGLE_TYPE[data.category.toLowerCase()] : undefined;
      const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      searchUrl.searchParams.set("location", `${EVENT_CONFIG.venue.latitude},${EVENT_CONFIG.venue.longitude}`);
      searchUrl.searchParams.set("radius", "6000");
      searchUrl.searchParams.set("key", mapsKey);
      if (typeParam) searchUrl.searchParams.set("type", typeParam);
      if (data.query) searchUrl.searchParams.set("keyword", data.query);

      const res = await fetch(searchUrl.toString());
      if (res.ok) {
        const json = (await res.json()) as { results?: any[]; status?: string };
        if (json.results && json.results.length > 0) {
          const livePlaces: Place[] = json.results.map((p) => {
            const lat = p.geometry?.location?.lat;
            const lng = p.geometry?.location?.lng;
            return {
              id: p.place_id,
              name: p.name,
              address: p.vicinity,
              rating: p.rating,
              latitude: lat,
              longitude: lng,
              openNow: p.opening_hours?.open_now,
              distanceMeters:
                lat != null && lng != null
                  ? Math.round(haversineMeters(EVENT_CONFIG.venue.latitude, EVENT_CONFIG.venue.longitude, lat, lng))
                  : undefined,
            };
          });

          // Append non-duplicate live places
          const existingNames = new Set(results.map((r) => r.name.toLowerCase()));
          for (const lp of livePlaces) {
            if (!existingNames.has(lp.name.toLowerCase())) {
              results.push(lp);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Places API] Failed live fetch, using reference fallback:", err);
    }

    results.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    return results;
  });

export type DirectionsRoute = {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  steps: { instruction: string; distanceMeters: number; durationText?: string }[];
  summary?: string;
};

export const getDirections = createServerFn({ method: "POST" })
  .validator((input: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    travelMode?: "WALK" | "DRIVE";
  }) => {
    if (
      typeof input.originLat !== "number" ||
      typeof input.originLng !== "number" ||
      typeof input.destLat !== "number" ||
      typeof input.destLng !== "number"
    ) {
      throw new Error("Invalid coordinates");
    }
    return input;
  })
  .handler(async ({ data }): Promise<DirectionsRoute> => {
    const mapsKey = getMapsApiKey();
    const mode = data.travelMode === "DRIVE" ? "driving" : "walking";

    try {
      const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
      url.searchParams.set("origin", `${data.originLat},${data.originLng}`);
      url.searchParams.set("destination", `${data.destLat},${data.destLng}`);
      url.searchParams.set("mode", mode);
      url.searchParams.set("key", mapsKey);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = (await res.json()) as any;
        if (json.status === "OK" && json.routes?.[0]?.legs?.[0]) {
          const route = json.routes[0];
          const leg = route.legs[0];

          const steps = (leg.steps ?? []).map((s: any) => ({
            instruction: s.html_instructions || s.instructions || "Continue",
            distanceMeters: s.distance?.value ?? 0,
            durationText: s.duration?.text,
          }));

          return {
            distanceMeters: leg.distance?.value ?? 0,
            durationSeconds: leg.duration?.value ?? 0,
            encodedPolyline: route.overview_polyline?.points ?? "",
            summary: route.summary,
            steps,
          };
        }
      }
    } catch (err) {
      console.error("[Directions API] Error:", err);
    }

    // Geodesic fallback if network or routing endpoint had an issue
    const distMeters = Math.round(
      haversineMeters(data.originLat, data.originLng, data.destLat, data.destLng),
    );
    const speedMps = data.travelMode === "DRIVE" ? 11 : 1.4; // ~40km/h vs ~5km/h
    const durationSeconds = Math.round(distMeters / speedMps);

    return {
      distanceMeters: distMeters,
      durationSeconds,
      encodedPolyline: "",
      steps: [
        {
          instruction: `Head toward destination (${(distMeters / 1000).toFixed(1)} km direct)`,
          distanceMeters: distMeters,
        },
      ],
    };
  });
