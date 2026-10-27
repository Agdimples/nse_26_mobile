import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(messages)) {
            return new Response("Messages required", { status: 400 });
          }

          // Gemini direct (Google's OpenAI-compatible endpoint). Preference:
          // a dedicated GEMINI_API_KEY, else the existing GOOGLE_MAPS_API_KEY
          // (same GCP project — both work once the Generative Language API is
          // enabled for the project), keeping LOVABLE_API_KEY as a legacy
          // fallback.
          const key =
            process.env.GEMINI_API_KEY ??
            process.env.GOOGLE_MAPS_API_KEY ??
            process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response(JSON.stringify({ error: "The AI concierge is not connected yet — please check back soon." }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Build event context from the database
          const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
          const anon =
            process.env.SUPABASE_PUBLISHABLE_KEY ??
            process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
            process.env.VITE_SUPABASE_ANON_KEY;
          let eventContext = "";
          if (url && anon) {
            const supabase = createClient<Database>(url, anon);
            const [speakersRes, sessionsRes, accomRes, emergencyRes, annRes] = await Promise.all([
              supabase.from("speakers").select("name, title, company, is_keynote"),
              supabase.from("sessions").select("title, day, starts_at, ends_at, room, track, description, session_speakers(speakers(name))").order("starts_at"),
              supabase.from("accommodations").select("name, distance_km, price_range, address"),
              supabase.from("emergency_contacts").select("label, phone, description"),
              supabase.from("announcements").select("title, body, priority, created_at").order("created_at", { ascending: false }).limit(5),
            ]);
            eventContext = buildContext({
              speakers: speakersRes.data ?? [],
              sessions: sessionsRes.data ?? [],
              accommodations: accomRes.data ?? [],
              emergency: emergencyRes.data ?? [],
              announcements: annRes.data ?? [],
            });
          }

          const gemini = createOpenAICompatible({
            name: "google-gemini",
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
            apiKey: key,
            headers: { Authorization: `Bearer ${key}` },
          });
          const result = streamText({
            model: gemini("gemini-3.8-flash"), // current-only model name for new Gemini API keys (2.5-flash is retired for new users)
            system: `You are the friendly AI concierge for ${EVENT_CONFIG.name} ${EVENT_CONFIG.year} (${EVENT_CONFIG.brandName}) — ${EVENT_CONFIG.tagline}. The conference runs ${EVENT_CONFIG.dates} at ${EVENT_CONFIG.venue.name}, ${EVENT_CONFIG.venue.address}.

Be concise, warm, and confident. Answer questions about the schedule, sessions, speakers, venue halls, delegate shuttles, hotels, and emergency contacts. When asked about timing or location, give specific answers. If the user asks something outside the conference, politely steer them back.

Use markdown formatting (bold, lists) when it helps readability.

OFFICIAL SECRETARIAT ENQUIRIES:
- Registration Desk: +234 201 330 1060 (Ext. 4815, 4852, 4851, 4861)
- Technical Support: +234 201 330 1060 (Ext. 4833)
- Partnership & Exhibition: +234 201 330 1060 (Ext. 4855) / mimusa@nse.org.ng
- General Email: conference@nse.org.ng

EVENT KNOWLEDGE:
${eventContext}

WI-FI: ${EVENT_CONFIG.wifi.ssid} / ${EVENT_CONFIG.wifi.password}
VENUE: ${EVENT_CONFIG.venue.name}, ${EVENT_CONFIG.venue.address}
CONFERENCE HOTLINE: ${EVENT_CONFIG.primaryHotline}`.trim(),
            messages: await convertToModelMessages(messages),
          });

          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err) {
          console.error("Chat error", err);
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});

function buildContext(d: {
  speakers: Array<{ name: string; title: string | null; company: string | null; is_keynote: boolean }>;
  sessions: Array<{ title: string; day: number; starts_at: string; ends_at: string; room: string | null; track: string | null; description: string | null; session_speakers: Array<{ speakers: { name: string } | null }> }>;
  accommodations: Array<{ name: string; distance_km: number | null; price_range: string | null; address: string | null }>;
  emergency: Array<{ label: string; phone: string; description: string | null }>;
  announcements: Array<{ title: string; body: string; priority: string; created_at: string }>;
}) {
  const fmt = (iso: string) => new Date(iso).toLocaleString("en-NG", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" });
  return `
SPEAKERS:
${d.speakers.map((s) => `- ${s.name}${s.is_keynote ? " (KEYNOTE)" : ""} — ${[s.title, s.company].filter(Boolean).join(", ")}`).join("\n")}

SESSIONS:
${d.sessions.map((s) => `- Day ${s.day}, ${fmt(s.starts_at)}-${fmt(s.ends_at)}: "${s.title}" in ${s.room ?? "TBA"} (${s.track ?? "-"})${s.session_speakers?.length ? ` — speakers: ${s.session_speakers.map(ss => ss.speakers?.name).filter(Boolean).join(", ")}` : ""}`).join("\n")}

HOTELS:
${d.accommodations.map((h) => `- ${h.name} — ${h.distance_km ?? "?"} km away, ${h.price_range ?? "ask"}, ${h.address ?? ""}`).join("\n")}

EMERGENCY CONTACTS:
${d.emergency.map((e) => `- ${e.label}: ${e.phone}${e.description ? ` (${e.description})` : ""}`).join("\n")}

LATEST ANNOUNCEMENTS:
${d.announcements.map((a) => `- [${a.priority}] ${a.title}: ${a.body}`).join("\n")}
`.trim();
}
