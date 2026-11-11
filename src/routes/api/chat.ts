import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { EVENT_CONFIG } from "@/lib/event-config";
import { conferenceSchedule } from "@/data/conference-schedule";
import { answerLocally, relevantKnowledge } from "@/lib/concierge-knowledge";

const liveContextCache = new Map<string, { expiresAt: number; value: Promise<string> }>();

function cachedLiveContext(key: string, load: () => Promise<string>): Promise<string> {
  const cached = liveContextCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = load().catch((error: unknown) => {
    liveContextCache.delete(key);
    throw error;
  });
  liveContextCache.set(key, { expiresAt: Date.now() + 60_000, value });
  return value;
}

async function getLiveContext(question: string): Promise<string> {
  const requests: Promise<string>[] = [];
  const normalized = question.toLowerCase();
  const asksAboutSpeakers = /\b(speakers?|keynotes?|presenters?|panelists?|who is speaking)\b/.test(
    normalized,
  );
  const asksAboutAnnouncements = /\b(announcements?|updates?|news|notices?|what changed)\b/.test(
    normalized,
  );
  const asksAboutSchedule =
    /\b(schedule|programme|program|industrial visit|tour|session|event on)\b/.test(normalized);
  const asksAboutEmergency =
    /\b(emergency|urgent|ambulance|police|hospital|security contact)\b/.test(normalized);

  if (!asksAboutSpeakers && !asksAboutAnnouncements && !asksAboutEmergency && !asksAboutSchedule) {
    return "";
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anon =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return "Live speaker, announcement, emergency, and programme records are unavailable.";
  }

  const supabase = createClient<Database>(url, anon);

  if (asksAboutSpeakers) {
    requests.push(
      cachedLiveContext("speakers", async () => {
        const { data, error } = await supabase
          .from("speakers")
          .select("name, title, company, is_keynote")
          .order("name")
          .limit(100);
        if (error) {
          console.error("Chat speaker lookup error", error);
          return "The live speaker list could not be loaded; do not guess speaker details.";
        }
        return `SPEAKERS:\n${(data ?? [])
          .map(
            (speaker) =>
              `- ${speaker.name}${speaker.is_keynote ? " (keynote)" : ""}${speaker.title ? ` — ${speaker.title}` : ""}${speaker.company ? `, ${speaker.company}` : ""}`,
          )
          .join("\n")}`;
      }),
    );
  }

  if (asksAboutAnnouncements) {
    requests.push(
      cachedLiveContext("announcements", async () => {
        const { data, error } = await supabase
          .from("announcements")
          .select("title, body, priority, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        if (error) {
          console.error("Chat announcements lookup error", error);
          return "The live announcements could not be loaded; do not guess recent updates.";
        }
        return `LATEST ANNOUNCEMENTS:\n${(data ?? [])
          .map(
            (announcement) =>
              `- [${announcement.priority}] ${announcement.title}: ${announcement.body}`,
          )
          .join("\n")}`;
      }),
    );
  }

  if (asksAboutEmergency) {
    requests.push(
      cachedLiveContext("emergency", async () => {
        const { data, error } = await supabase
          .from("emergency_contacts")
          .select("label, phone, description")
          .order("sort_order");
        if (error) {
          console.error("Chat emergency lookup error", error);
          return "The live emergency contacts could not be loaded; do not guess emergency numbers.";
        }
        return `EMERGENCY CONTACTS:\n${(data ?? [])
          .map(
            (contact) =>
              `- ${contact.label}: ${contact.phone}${contact.description ? ` (${contact.description})` : ""}`,
          )
          .join("\n")}`;
      }),
    );
  }

  if (asksAboutSchedule) {
    requests.push(
      cachedLiveContext("schedule-events", async () => {
        return `PUBLISHED PROGRAMME:\n${conferenceSchedule
          .flatMap((day, index) =>
            day.events.map(
              (event) =>
                `- Day ${index + 1} (${day.date}), ${event.time}: ${event.title}${event.location ? ` at ${event.location}` : ""}${event.category ? ` [${event.category}]` : ""}`,
            ),
          )
          .join("\n")}`;
      }),
    );
  }

  return (await Promise.all(requests)).join("\n\n");
}

function userQuestions(messages: UIMessage[]): string[] {
  return messages
    .filter((message) => message.role === "user")
    .map((message) =>
      message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n"),
    );
}

function getLastQuestion(messages: UIMessage[]): string {
  return userQuestions(messages).at(-1) ?? "";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(messages)) {
            return new Response("Messages required", { status: 400 });
          }

          const key = process.env.GEMINI_API_KEY ?? process.env.LOVABLE_API_KEY;
          const question = getLastQuestion(messages);
          if (!key) {
            // No AI key configured: answer from the bundled conference data.
            const answer = answerLocally(question, userQuestions(messages).slice(-3, -1));
            const stream = createUIMessageStream({
              originalMessages: messages,
              execute: ({ writer }) => {
                writer.write({ type: "text-start", id: "local" });
                writer.write({ type: "text-delta", id: "local", delta: answer });
                writer.write({ type: "text-end", id: "local" });
              },
            });
            return createUIMessageStreamResponse({ stream });
          }

          const [bundledContext, liveContext] = await Promise.all([
            Promise.resolve(relevantKnowledge(question)),
            getLiveContext(question),
          ]);
          const eventContext = [bundledContext, liveContext].filter(Boolean).join("\n\n");
          const gemini = createOpenAICompatible({
            name: "google-gemini",
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
            apiKey: key,
            headers: { Authorization: `Bearer ${key}` },
          });
          const result = streamText({
            model: gemini("gemini-3.8-flash"),
            system:
              `You are a friendly, capable assistant for ${EVENT_CONFIG.name} ${EVENT_CONFIG.year} (${EVENT_CONFIG.brandName}). The conference runs ${EVENT_CONFIG.dates} at ${EVENT_CONFIG.venue.name}, ${EVENT_CONFIG.venue.address}.

Help with the full conference experience: schedules and activities, speakers, registration, venue and halls, hotels, transport, local amenities, safety, and using the app. You may also answer general questions naturally; do not force every conversation into an FAQ or redirect users just because their question is not an FAQ. If a conference-specific detail is not in the supplied information, say so plainly instead of guessing. For general topics, distinguish general knowledge from official conference information.

Be warm, direct, and concise. Answer the question asked; use short lists or markdown only when useful.

OFFICIAL SECRETARIAT ENQUIRIES:
- Registration Desk: +234 201 330 1060 (Ext. 4815, 4852, 4851, 4861)
- Technical Support: +234 201 330 1060 (Ext. 4833)
- Partnership & Exhibition: +234 201 330 1060 (Ext. 4855) / mimusa@nse.org.ng
- General Email: conference@nse.org.ng

WI-FI: ${EVENT_CONFIG.wifi.ssid} / ${EVENT_CONFIG.wifi.password}
CONFERENCE HOTLINE: ${EVENT_CONFIG.primaryHotline}

RELEVANT CONFERENCE INFORMATION:
${eventContext || "No matching reference entry was found. Ask a brief clarifying question when needed."}`.trim(),
            messages: await convertToModelMessages(messages.slice(-12)),
            maxOutputTokens: 500,
          });

          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err) {
          console.error("Chat error", err);
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
