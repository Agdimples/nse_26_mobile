import { supabase } from "@/integrations/supabase/client";
import { conferenceSchedule } from "@/data/conference-schedule";
import { programmeSpeakers } from "@/data/programme-speakers";
import hotelsData from "@/data/hotels.json";

export type SeedKey = "speakers" | "programme" | "hotels" | "emergency";

export type SeedResult = { added: number; skipped: number };

const norm = (s: string) => s.trim().toLowerCase();

const EMERGENCY_CONTACTS = [
  {
    label: "Registration & Secretariat Desk",
    phone: "+234 201 330 1060",
    category: "general",
    description: "ICC Main Lobby — Ext. 4815, 4852, 4851, 4861",
  },
  {
    label: "Technical Support Desk",
    phone: "+234 201 330 1060",
    category: "technical",
    description: "Presentation and IT issues — Ext. 4833",
  },
  {
    label: "Partnership & Exhibition Desk",
    phone: "+234 201 330 1060",
    category: "partnership",
    description: "Exhibitor & partnership enquiries — Ext. 4855",
  },
  {
    label: "24/7 Operations Desk",
    phone: "+2348009876543",
    category: "general",
    description: "Conference operations hotline",
  },
  {
    label: "Police (Borno Command)",
    phone: "112",
    category: "police",
    description: "National emergency line",
  },
  {
    label: "Ambulance / Medical",
    phone: "112",
    category: "medical",
    description: "Emergency medical response team at ICC",
  },
  {
    label: "ICC Security Desk",
    phone: "112",
    category: "emergency",
    description: "Inside ICC — contact the venue security desk in person.",
  },
];

const TIER_TO_PRICE: Record<string, number> = { value: 2, standard: 3, pending: 3, premier: 4 };

async function existingNames(table: "speakers" | "accommodations", column: "name") {
  const { data, error } = await supabase.from(table).select(column);
  if (error) throw error;
  return new Set((data ?? []).map((r) => norm((r as { name: string }).name)));
}

async function seedSpeakers(): Promise<SeedResult> {
  const have = await existingNames("speakers", "name");
  const rows = programmeSpeakers
    .filter((s) => !have.has(norm(s.name)))
    .map((s) => ({
      name: s.name,
      title: s.role,
      is_keynote: /keynote/i.test(s.role),
    }));
  if (rows.length) {
    const { error } = await supabase.from("speakers").insert(rows);
    if (error) throw error;
  }
  return { added: rows.length, skipped: programmeSpeakers.length - rows.length };
}

async function seedProgramme(): Promise<SeedResult> {
  const { data, error } = await supabase.from("schedule_events").select("day, title, time");
  if (error) throw error;
  const have = new Set((data ?? []).map((e) => `${e.day}|${norm(e.title)}|${norm(e.time)}`));
  const rows = conferenceSchedule.flatMap((d, i) =>
    d.events.map((e, j) => ({
      day: i + 1,
      title: e.title,
      time: e.time,
      location: e.location,
      category: e.category,
      sort_order: j + 1,
    })),
  );
  const missing = rows.filter((r) => !have.has(`${r.day}|${norm(r.title)}|${norm(r.time)}`));
  if (missing.length) {
    const { error: insertError } = await supabase.from("schedule_events").insert(missing);
    if (insertError) throw insertError;
  }
  return { added: missing.length, skipped: rows.length - missing.length };
}

type HotelJson = {
  name: string;
  location: string;
  distanceToVenue?: string;
  description?: string;
  highlights?: string[];
  rooms?: { label: string; rate: string }[];
  images?: { preview: string }[];
  latitude?: number | null;
  longitude?: number | null;
  qualityTier: string;
  contactPhone?: string;
};

async function seedHotels(): Promise<SeedResult> {
  const hotels = hotelsData as HotelJson[];
  const have = await existingNames("accommodations", "name");
  const rows = hotels
    .filter((h) => !have.has(norm(h.name)))
    .map((h) => {
      const km = parseFloat(h.distanceToVenue ?? "");
      const rates = (h.rooms ?? []).map((r) => `${r.label}: ${r.rate}`);
      return {
        name: h.name,
        address: h.location,
        description: h.description ?? null,
        distance_km: Number.isFinite(km) ? km : null,
        price_tier: TIER_TO_PRICE[h.qualityTier] ?? 3,
        price_range: rates.length ? rates.join(" · ") : null,
        amenities: h.highlights ?? [],
        image_url: h.images?.[0]?.preview ?? null,
        latitude: h.latitude ?? null,
        longitude: h.longitude ?? null,
      };
    });
  if (rows.length) {
    const { error } = await supabase.from("accommodations").insert(rows);
    if (error) throw error;
  }
  return { added: rows.length, skipped: hotels.length - rows.length };
}

async function seedEmergency(): Promise<SeedResult> {
  const { data, error } = await supabase.from("emergency_contacts").select("label");
  if (error) throw error;
  const have = new Set((data ?? []).map((r) => norm(r.label)));
  const rows = EMERGENCY_CONTACTS.map((c, i) => ({ ...c, sort_order: i + 1 })).filter(
    (c) => !have.has(norm(c.label)),
  );
  if (rows.length) {
    const { error: insertError } = await supabase.from("emergency_contacts").insert(rows);
    if (insertError) throw insertError;
  }
  return { added: rows.length, skipped: EMERGENCY_CONTACTS.length - rows.length };
}

export const SEEDERS: Record<SeedKey, () => Promise<SeedResult>> = {
  speakers: seedSpeakers,
  programme: seedProgramme,
  hotels: seedHotels,
  emergency: seedEmergency,
};
