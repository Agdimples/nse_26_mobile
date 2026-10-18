// Bundled reference data — synced from the Flutter app's assets by
// tool/sync_web_data.mjs (runs as prebuild). When we move to Supabase,
// these become the fallback layer.
import hotelsJson from "@/data/hotels.json";
import venueJson from "@/data/venue.json";
import conferenceInfoJson from "@/data/conference-info.json";
import faqsJson from "@/data/faqs.json";
import transportJson from "@/data/transport.json";

export interface HotelRoom {
  label: string;
  rate: string;
}

export interface Hotel {
  id: string;
  rank: number;
  qualityTier: "premier" | "standard" | "value" | "pending";
  name: string;
  shortName: string;
  tone: string;
  location: string;
  distanceToVenue: string | null;
  contactPhone: string | null;
  description: string;
  roomSummary: string | null;
  rateStatus: string;
  highlights: string[];
  rooms: HotelRoom[];
  images: { preview: string; thumb: string }[];
  photoCount: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface NearbyPoi {
  id: string;
  name: string;
  category: string;
  distance?: string;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
  note?: string;
  phone?: string;
  query?: string;
  /** Restaurant-specific fields */
  address?: string;
  imageFolder?: string;
  imageCount?: number;
}

export interface VenueData {
  venue: { name: string; shortName: string; latitude: number; longitude: number; image: string };
  shuttle: string;
  parking: string;
  directions: string[];
  nearby: NearbyPoi[];
}

export const HOTELS = hotelsJson as Hotel[];
export const VENUE_DATA = venueJson as VenueData;

export interface FeeItem {
  category: string;
  amount: string;
  benefits: string[];
}

export interface ScheduleOutlineItem {
  day: number;
  date: string;
  time: string;
  title: string;
  summary: string;
}

export interface ConferenceInfo {
  organizationName: string;
  conferenceTitle: string;
  shortTitle?: string;
  theme: string;
  dates: string;
  venue: string;
  chairman: string;
  logoUrl: string;
  officialSite: string;
  registrationPortal?: string;
  aboutSummary?: string;
  stats: { label: string; value: string }[];
  societyStats?: { label: string; value: string }[];
  scheduleOutline?: ScheduleOutlineItem[];
  fees?: {
    earlyBird: { period: string; items: FeeItem[] };
    lateRegistration: { period: string; items: FeeItem[] };
  };
  guidelines?: {
    individual: string[];
    group: string[];
  };
  enquiries?: {
    registration: string;
    technical: string;
    partnership: string;
    partnershipEmail?: string;
    email: string;
  };
  acknowledgment?: string;
  entertainment: { title: string; chair: string; focus: string };
  spouses: { title: string; venue: string; focus: string };
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface Bus {
  id: string;
  name: string;
  hotelId: string;
  routeLabel: string;
  capacity: number;
  marshalName: string;
  marshalPhone: string;
  pickupPoint: string;
}

export interface TransportData {
  defaultPolicy: "fixed_assignment" | "open_boarding" | "hybrid";
  policyDescriptions: Record<string, string>;
  buses: Bus[];
  scheduleTemplate: { label: string; direction: "to_venue" | "to_hotel"; time: string }[];
}

export const CONFERENCE_INFO = conferenceInfoJson as ConferenceInfo;
export const FAQS = faqsJson as FaqItem[];
export const TRANSPORT = transportJson as TransportData;

/** Search FAQs the same way the Flutter app does: question + answer + keywords. */
export function searchFaqs(query: string): FaqItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FAQS;
  const words = q.split(/\s+/);
  return FAQS.map((f) => {
    const haystack = `${f.question} ${f.answer} ${f.keywords.join(" ")}`.toLowerCase();
    const score = words.reduce((n, w) => n + (haystack.includes(w) ? 1 : 0), 0);
    return { faq: f, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.faq);
}

export function faqsByCategory(): Map<string, FaqItem[]> {
  const map = new Map<string, FaqItem[]>();
  for (const f of FAQS) {
    const list = map.get(f.category) ?? [];
    list.push(f);
    map.set(f.category, list);
  }
  return map;
}

/** Minimum numeric nightly rate across a hotel's room list, in naira. */
export function hotelMinRate(hotel: Hotel): number | null {
  const nums = hotel.rooms
    .map((r) => {
      // Take the FIRST standalone amount in the rate string. Joining all digits
      // mangles ranges and annotations: "N21,829 - N30,409" -> 2182930409,
      // "N60,000 (15% discount)" -> 6000015.
      const matches = String(r.rate).match(/\d[\d,]*(?:\.\d+)?/g);
      if (!matches) return NaN;
      const amounts = matches.map((s) => Number(s.replace(/,/g, ""))).filter((n) => n >= 1000);
      return amounts.length ? amounts[0] : Number(matches[0].replace(/,/g, ""));
    })
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? Math.min(...nums) : null;
}

export function hotelDistanceKm(hotel: Hotel): number | null {
  const m = hotel.distanceToVenue?.match(/([\d.]+)\s*km/i);
  return m ? Number(m[1]) : null;
}

export function hasHotelPhotos(hotel: Hotel): boolean {
  return hotel.photoCount > 0;
}

/** Photo URL resolver: bundled photos live under /hotels/<id>/preview on the web. */
export function hotelPhotoUrl(hotel: Hotel, index = 0, thumb = true): string {
  const img = hotel.images[index];
  if (!img) return "";
  // Only preview images are bundled; thumbs fall back to them.
  return img.preview;
}

export const POI_CATEGORY_ORDER = [
  "Airport",
  "Security",
  "Restaurant",
  "Government",
  "Culture",
  "Hospital",
  "Pharmacy",
  "ATM",
  "Shopping",
  "Spouses visit",
] as const;

export function poisByCategory(pois: NearbyPoi[]): Map<string, NearbyPoi[]> {
  const map = new Map<string, NearbyPoi[]>();
  for (const poi of pois) {
    const list = map.get(poi.category) ?? [];
    list.push(poi);
    map.set(poi.category, list);
  }
  return map;
}

/** Haversine distance in km between two lat/lng pairs. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export { formatNGN } from "./format";
