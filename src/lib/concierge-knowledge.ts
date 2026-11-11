import { CONFERENCE_INFO, FAQS, HOTELS, TRANSPORT, VENUE_DATA } from "@/lib/reference";
import { EVENT_CONFIG } from "@/lib/event-config";
import { conferenceSchedule, type ConferenceScheduleEvent } from "@/data/conference-schedule";
import { programmeSpeakers } from "@/data/programme-speakers";
import { CATEGORY_LABELS, ICC_FLOORS, ICC_SITE } from "@/data/icc-floors";

/*
 * Offline concierge: answers from the bundled conference data without an AI key.
 * Retrieval is BM25 over stemmed tokens with synonym expansion and typo correction,
 * plus dedicated handlers for questions that need computing (time of day, day of week,
 * closest/cheapest hotel, nearby places).
 */

type Kind =
  | "overview"
  | "faq"
  | "event"
  | "speaker"
  | "hotel"
  | "venue"
  | "nearby"
  | "room"
  | "transport"
  | "contact";

interface Doc {
  kind: Kind;
  title: string;
  answer: string;
  counts: Map<string, number>;
  length: number;
  titleTokens: string[];
  meta?: { category?: string; distanceKm?: number; terms?: Set<string> };
}

const STOP = new Set(
  (
    "about after all and any are can could does for from give has have help how into let more " +
    "need please show tell that the their them there these this those want was were what when " +
    "where which who whom whose why will with would you your yours know find get got its our " +
    "conference nse 2026 today tomorrow tonight now whats hows wheres whos thats theres"
  ).split(" "),
);

const SYNONYM_GROUPS: string[][] = [
  ["wifi", "internet", "hotspot", "online"],
  ["toilet", "restroom", "washroom", "bathroom", "wc", "lavatory"],
  [
    "food",
    "eat",
    "meal",
    "lunch",
    "dinner",
    "breakfast",
    "restaurant",
    "snack",
    "hungry",
    "cafe",
    "catering",
  ],
  ["hotel", "accommodation", "lodge", "lodging", "stay", "suite", "guesthouse", "sleep"],
  ["bus", "shuttle", "transport", "pickup", "ride", "transit"],
  [
    "medical",
    "doctor",
    "hospital",
    "clinic",
    "ambulance",
    "firstaid",
    "nurse",
    "sick",
    "medicine",
    "pharmacy",
  ],
  ["emergency", "urgent", "danger", "security", "police", "hotline"],
  ["cost", "price", "fee", "rate", "charge", "pay", "payment", "fare", "amount"],
  ["start", "begin", "commence", "opening"],
  ["end", "finish", "conclude", "closing"],
  ["schedule", "programme", "program", "agenda", "timetable", "itinerary"],
  [
    "speaker",
    "presenter",
    "keynote",
    "panelist",
    "moderator",
    "lecturer",
    "moderating",
    "moderate",
    "speaking",
    "presenting",
  ],
  ["cultural", "culture", "welfare", "entertainment"],
  ["spouse", "wife", "wives", "husband", "companion"],
  ["young", "youth", "student"],
  ["badge", "lanyard", "accreditation", "tag"],
  ["register", "registration", "signup", "enroll", "enrol"],
  ["parking", "park", "car", "vehicle"],
  ["airport", "flight", "plane", "fly"],
  ["exhibition", "expo", "booth", "exhibitor"],
  ["press", "media", "journalist", "reporter"],
  ["dress", "attire", "clothing", "wear"],
  ["phone", "call", "number", "contact", "reach", "email"],
  ["lift", "elevator"],
  ["stairs", "staircase"],
  ["wheelchair", "accessible", "accessibility", "disabled", "disability"],
  ["gala", "banquet"],
  ["suya", "kebab", "grill", "grilled", "barbecue", "bbq", "kilishi"],
  ["shawarma", "wrap"],
  ["fish", "seafood"],
  ["milk", "dairy", "yoghurt", "yogurt"],
  ["coffee", "latte", "espresso", "tea"],
  ["groceries", "grocery", "supermarket", "provisions", "toiletries"],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/wi[\s-]?fi/g, "wifi")
    .replace(/first[\s-]?aid/g, "firstaid")
    .replace(/['’]s\b/g, "")
    .replace(/&/g, " and ");
}

function stem(word: string): string {
  if (/^\d+$/.test(word) || word.length <= 3) return word;
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (/(ches|shes|xes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

function tokenize(text: string): string[] {
  return (normalize(text).match(/[a-z0-9]+/g) ?? [])
    .filter((t) => !STOP.has(t) && (t.length >= 3 || /^\d+$/.test(t)))
    .map(stem);
}

const SYNONYMS = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const stems = group.map(stem);
  for (const s of stems) {
    const set = SYNONYMS.get(s) ?? new Set<string>();
    for (const other of stems) if (other !== s) set.add(other);
    SYNONYMS.set(s, set);
  }
}

// ---------------------------------------------------------------------------
// Time and date helpers
// ---------------------------------------------------------------------------

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function dayKey(dateText: string): string {
  const m = dateText.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return "";
  const month = MONTHS.indexOf(m[1].toLowerCase()) + 1;
  return `${m[3]}-${String(month).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

const DAY_KEYS = conferenceSchedule.map((day) => dayKey(day.date));

function lagosNow(): { key: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    key: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function formatClock(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, "0")}${h24 < 12 ? "am" : "pm"}`;
}

function parseClockToken(hour: string, minute: string | undefined, meridiem: string): number {
  let h = Number(hour) % 12;
  if (meridiem.toLowerCase().startsWith("p")) h += 12;
  return h * 60 + Number(minute ?? 0);
}

function eventRange(event: ConferenceScheduleEvent): { start: number; end: number } | null {
  const found = [...event.time.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([ap])m/gi)].map((m) =>
    parseClockToken(m[1], m[2], m[3]),
  );
  if (!found.length) return null;
  return { start: found[0], end: found[1] ?? found[0] + 60 };
}

function parseClockFromQuestion(q: string): number | null {
  const meridiem = q.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?m\b/i);
  if (meridiem) return parseClockToken(meridiem[1], meridiem[2], meridiem[3]);
  const h24 = q.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (h24) return Number(h24[1]) * 60 + Number(h24[2]);
  if (/\b(noon|midday)\b/i.test(q)) return 12 * 60;
  return null;
}

type DayRef = { index: number } | { note: string } | null;

function parseDayRef(q: string): DayRef {
  const lower = q.toLowerCase();
  const named = conferenceSchedule.findIndex((day) =>
    new RegExp(`\\b${day.date.split(",")[0].toLowerCase()}\\b`).test(lower),
  );
  if (named !== -1) return { index: named };

  const numbered = lower.match(/\bday\s*([1-9])\b/);
  if (numbered && Number(numbered[1]) <= conferenceSchedule.length) {
    return { index: Number(numbered[1]) - 1 };
  }
  if (/\b(first|opening)\s+day\b/.test(lower)) return { index: 0 };
  if (/\b(last|final)\s+day\b/.test(lower)) return { index: conferenceSchedule.length - 1 };

  const relative = lower.match(
    /\b(today|tonight|tomorrow|now|right now|currently|at the moment)\b/,
  );
  if (!relative) return null;

  const { key } = lagosNow();
  let target = key;
  if (relative[1] === "tomorrow") {
    const d = new Date(`${key}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    target = d.toISOString().slice(0, 10);
  }
  const index = DAY_KEYS.indexOf(target);
  if (index !== -1) return { index };

  const first = DAY_KEYS[0];
  if (target < first) {
    const days = Math.round(
      (new Date(`${first}T00:00:00Z`).getTime() - new Date(`${target}T00:00:00Z`).getTime()) /
        86_400_000,
    );
    return {
      note: `The conference hasn't started yet — it opens on **${conferenceSchedule[0].date}** (${days} day${days === 1 ? "" : "s"} to go).`,
    };
  }
  return {
    note: "The conference has finished — I can still tell you about any day of the programme.",
  };
}

function isNote(ref: DayRef): ref is { note: string } {
  return !!ref && "note" in ref;
}

// ---------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------

function makeDoc(kind: Kind, title: string, answer: string, text: string, meta?: Doc["meta"]): Doc {
  const tokens = [...tokenize(title), ...tokenize(title), ...tokenize(title), ...tokenize(text)];
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return {
    kind,
    title,
    answer,
    counts,
    length: tokens.length,
    titleTokens: [...new Set(tokenize(title.replace(/\(.*?\)/g, "")))],
    meta,
  };
}

function formatEventOccurrence(date: string, event: ConferenceScheduleEvent): string {
  const lines = [
    `**${date}** · ${event.time}`,
    event.location ? `Location: ${event.location}` : "Location: to be announced",
  ];
  if (event.summary) lines.push(event.summary);
  for (const d of event.details ?? []) lines.push(`- ${d.label}: ${d.value}`);
  for (const t of event.timeline ?? []) lines.push(`- ${t.time} — ${t.text}`);
  return lines.join("\n");
}

function firstSentence(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentence = clean.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? clean;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

function parseKm(distance: string | null | undefined): number | undefined {
  const m = distance?.match(/([\d.]+)\s*km/i);
  return m ? Number(m[1]) : undefined;
}

function minRate(rooms: { rate: string }[]): number | undefined {
  const values = rooms
    .map((room) => room.rate.match(/N\s?([\d,]+)/i)?.[1])
    .filter((v): v is string => !!v)
    .map((v) => Number(v.replace(/,/g, "")));
  return values.length ? Math.min(...values) : undefined;
}

function buildDocs(): Doc[] {
  const docs: Doc[] = [];

  docs.push(
    makeDoc(
      "overview",
      "Conference overview",
      [
        `**${CONFERENCE_INFO.conferenceTitle}**`,
        `Theme: ${CONFERENCE_INFO.theme}.`,
        `Dates: ${EVENT_CONFIG.dates}. Venue: ${EVENT_CONFIG.venue.name}, ${EVENT_CONFIG.venue.address}.`,
        firstSentence(CONFERENCE_INFO.aboutSummary ?? "", 400),
        `Official website: ${CONFERENCE_INFO.officialSite}`,
      ].join("\n\n"),
      `about theme dates venue organiser chairman ${CONFERENCE_INFO.chairman} ${CONFERENCE_INFO.aboutSummary ?? ""} ${[
        ...CONFERENCE_INFO.stats,
        ...(CONFERENCE_INFO.societyStats ?? []),
      ]
        .map((s) => `${s.label} ${s.value}`)
        .join(" ")}`,
    ),
    makeDoc(
      "overview",
      "Conference numbers and the Nigerian Society of Engineers",
      `Expected at the conference: ${CONFERENCE_INFO.stats.map((s) => `**${s.value}** ${s.label.toLowerCase()}`).join(", ")}.\n\nThe Nigerian Society of Engineers: ${(CONFERENCE_INFO.societyStats ?? []).map((s) => `**${s.value}** ${s.label.toLowerCase()}`).join(", ")}.\n\nChairman: ${CONFERENCE_INFO.chairman}.`,
      `how many delegates speakers papers branches divisions members chairman president society statistics size`,
    ),
    makeDoc(
      "contact",
      "Wi-Fi",
      `Network: **${EVENT_CONFIG.wifi.ssid}**\nPassword: **${EVENT_CONFIG.wifi.password}**`,
      "wifi internet network password connect ssid",
    ),
    makeDoc(
      "contact",
      "Contacts and enquiries",
      [
        `- Registration desk: ${EVENT_CONFIG.registrationHotlines.join("; ")}`,
        `- Technical support: ${EVENT_CONFIG.technicalHotline}`,
        `- Partnership & exhibition: ${EVENT_CONFIG.partnershipContact} / ${EVENT_CONFIG.partnershipEmail}`,
        `- General email: ${EVENT_CONFIG.email}`,
        `- Portal: ${EVENT_CONFIG.portalUrl}`,
      ].join("\n"),
      "contact phone hotline email helpdesk support secretariat registration desk enquiries partnership exhibition call technical",
    ),
  );

  if (CONFERENCE_INFO.fees) {
    const tiers = [CONFERENCE_INFO.fees.earlyBird, CONFERENCE_INFO.fees.lateRegistration];
    docs.push(
      makeDoc(
        "overview",
        "Registration fees",
        tiers
          .map(
            (tier) =>
              `**${tier.period}**\n${tier.items.map((i) => `- ${i.category}: ${i.amount}`).join("\n")}`,
          )
          .join("\n\n"),
        `fees price cost early bird late ${tiers.flatMap((t) => t.items.map((i) => `${i.category} ${i.benefits.join(" ")}`)).join(" ")}`,
      ),
    );
  }

  for (const faq of FAQS) {
    docs.push(
      makeDoc(
        "faq",
        faq.question,
        faq.answer,
        `${faq.category} ${faq.answer} ${faq.keywords.join(" ")}`,
      ),
    );
  }

  const eventsByTitle = new Map<
    string,
    { title: string; items: { date: string; event: ConferenceScheduleEvent }[] }
  >();
  for (const day of conferenceSchedule) {
    for (const event of day.events) {
      const key = event.title.toLowerCase();
      const entry = eventsByTitle.get(key) ?? { title: event.title, items: [] };
      entry.items.push({ date: day.date, event });
      eventsByTitle.set(key, entry);
    }
  }
  for (const { title, items } of eventsByTitle.values()) {
    const text = items
      .map(({ date, event }) =>
        [
          date,
          event.time,
          event.location,
          event.summary ?? "",
          event.category ?? "",
          ...(event.details ?? []).map((d) => `${d.label} ${d.value}`),
          ...(event.timeline ?? []).map((t) => t.text),
        ].join(" "),
      )
      .join(" ");
    docs.push(
      makeDoc(
        "event",
        title,
        `**${title.replace(/\s*\(.*?\)\s*/g, " ").trim()}**\n\n${items.map(({ date, event }) => formatEventOccurrence(date, event)).join("\n\n")}`,
        text,
      ),
    );
  }

  for (const speaker of programmeSpeakers) {
    docs.push(
      makeDoc(
        "speaker",
        speaker.name,
        `**${speaker.name}** — ${speaker.role}`,
        `speaker ${speaker.role}`,
      ),
    );
  }

  for (const hotel of HOTELS) {
    const rates = hotel.rooms.map((room) => `${room.label}: ${room.rate}`).join("; ");
    docs.push(
      makeDoc(
        "hotel",
        hotel.name,
        [
          `**${hotel.name}** — ${hotel.location}`,
          hotel.distanceToVenue ? `- Distance to venue: ${hotel.distanceToVenue}` : "",
          rates ? `- Rates: ${rates}` : `- Rates: ${hotel.rateStatus}`,
          hotel.contactPhone ? `- Phone: ${hotel.contactPhone}` : "",
          firstSentence(hotel.description),
        ]
          .filter(Boolean)
          .join("\n"),
        `hotel accommodation ${hotel.shortName} ${hotel.location} ${hotel.qualityTier} ${hotel.highlights.join(" ")} ${hotel.description}`,
        { distanceKm: parseKm(hotel.distanceToVenue), category: hotel.qualityTier },
      ),
    );
  }

  docs.push(
    makeDoc(
      "venue",
      "Venue directions",
      `**${VENUE_DATA.venue.name}**\n${VENUE_DATA.directions.join(" ")}\n\nOpen **Directions** in the app for turn-by-turn help.`,
      `venue directions how to get address location map ${VENUE_DATA.directions.join(" ")}`,
    ),
    makeDoc(
      "venue",
      "Parking",
      VENUE_DATA.parking,
      `parking park car vehicle drop-off ${VENUE_DATA.parking}`,
    ),
    makeDoc(
      "transport",
      "Shuttle buses",
      `${VENUE_DATA.shuttle}\n\n${TRANSPORT.policyDescriptions[TRANSPORT.defaultPolicy]}\n\nRoutes and times are in the app's **Transport** section.`,
      `shuttle bus transport hotel route pickup schedule times policy ${VENUE_DATA.shuttle}`,
    ),
  );

  for (const bus of TRANSPORT.buses) {
    const hotelName = HOTELS.find((hotel) => hotel.id === bus.hotelId)?.name ?? bus.hotelId;
    docs.push(
      makeDoc(
        "transport",
        `${bus.name} shuttle route`,
        `**${bus.name}** — ${bus.routeLabel}\n- Pickup: ${bus.pickupPoint}\n- Hotel: ${hotelName}`,
        `bus shuttle route pickup ${bus.routeLabel} ${hotelName}`,
      ),
    );
  }

  for (const place of VENUE_DATA.nearby) {
    docs.push(
      makeDoc(
        "nearby",
        place.name,
        `**${place.name}** (${place.category})${place.distance ? ` — ${place.distance} from the venue` : ""}${place.note ? `\n${place.note}` : ""}${place.phone ? `\nPhone: ${place.phone}` : ""}`,
        `nearby ${place.category} ${place.category} ${place.category} ${place.note ?? ""} ${place.address ?? ""}`,
        {
          category: place.category,
          distanceKm: place.distanceKm ?? parseKm(place.distance),
          terms: new Set(tokenize(`${place.name} ${place.note ?? ""} ${place.address ?? ""}`)),
        },
      ),
    );
  }

  const rooms = new Map<
    string,
    {
      name: string;
      floors: Set<string>;
      category: string;
      description?: string;
      access?: string;
      number?: string;
    }
  >();
  for (const floor of [...ICC_FLOORS, ICC_SITE]) {
    for (const room of floor.rooms) {
      if (room.category === "circulation" || room.category === "open") continue;
      const key = room.name.toLowerCase();
      const entry = rooms.get(key) ?? {
        name: room.name,
        floors: new Set<string>(),
        category: CATEGORY_LABELS[room.category],
        description: room.description,
        access: room.accessibility,
        number: room.number,
      };
      entry.floors.add(floor.label);
      rooms.set(key, entry);
    }
  }
  for (const room of rooms.values()) {
    const floors = [...room.floors];
    const where = floors.includes("Site Plan")
      ? "on the ICC site plan"
      : `on the **${floors.join("** and **")}** of the ICC`;
    docs.push(
      makeDoc(
        "room",
        room.name,
        [
          `The **${room.name}** is ${where}.`,
          room.description ?? "",
          room.access ? `Accessibility: ${room.access}` : "",
          "Open **Map** in the app to see it highlighted on the floor plan.",
        ]
          .filter(Boolean)
          .join("\n\n"),
        `where location find floor icc ${room.category} ${room.number ?? ""} ${room.description ?? ""} ${floors.join(" ")}`,
      ),
    );
  }

  return docs;
}

interface Index {
  docs: Doc[];
  df: Map<string, number>;
  avgLength: number;
  vocabulary: string[];
}

let cachedIndex: Index | null = null;

function getIndex(): Index {
  if (cachedIndex) return cachedIndex;
  const docs = buildDocs();
  const df = new Map<string, number>();
  for (const doc of docs) for (const t of doc.counts.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const avgLength = docs.reduce((total, d) => total + d.length, 0) / docs.length;
  cachedIndex = { docs, df, avgLength, vocabulary: [...df.keys()] };
  return cachedIndex;
}

// ---------------------------------------------------------------------------
// Retrieval
// ---------------------------------------------------------------------------

function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

interface Ranked {
  doc: Doc;
  score: number;
  phrase: boolean;
}

interface QueryTerms {
  terms: string[];
  unknown: string[];
}

function analyseQuery(question: string, index: Index): QueryTerms {
  const terms: string[] = [];
  const unknown: string[] = [];
  for (const term of new Set(tokenize(question))) {
    if (index.df.has(term) || SYNONYMS.has(term) || /^\d+$/.test(term)) {
      terms.push(term);
      continue;
    }
    // Typo correction against the conference vocabulary.
    const limit = term.length >= 8 ? 2 : 1;
    let best: { word: string; distance: number; df: number } | null = null;
    if (term.length >= 5) {
      for (const word of index.vocabulary) {
        const distance = editDistance(term, word, limit);
        if (distance > limit) continue;
        const wordDf = index.df.get(word) ?? 0;
        if (!best || distance < best.distance || (distance === best.distance && wordDf > best.df)) {
          best = { word, distance, df: wordDf };
        }
      }
    }
    if (best) terms.push(best.word);
    else unknown.push(term);
  }
  return { terms, unknown };
}

function rank(question: string, limit = 8): { ranked: Ranked[]; unknown: string[] } {
  const index = getIndex();
  const { terms, unknown } = analyseQuery(question, index);
  if (!terms.length) return { ranked: [], unknown };

  const termSet = new Set(terms);
  const N = index.docs.length;
  const idf = (t: string) => {
    const n = index.df.get(t) ?? 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  };
  // A synonym never counts for more than the term it stands in for, otherwise a rare
  // synonym (e.g. "pharmacy" for "hospital") outranks exact matches.
  const synonymTerms = new Map<string, number>();
  for (const t of terms) {
    for (const s of SYNONYMS.get(t) ?? []) {
      if (!termSet.has(s)) synonymTerms.set(s, Math.max(synonymTerms.get(s) ?? 0, idf(t)));
    }
  }
  const k1 = 1.4;
  const b = 0.75;

  const lower = normalize(question);
  const asksWhere = /\b(where|located|location|directions?|way to|how (do|can) i get)\b/.test(
    lower,
  );
  const asksWhen = /\b(when|what time|starts?|begins?|date)\b/.test(lower);
  const asksHotel = /\b(hotels?|accommodation|lodging|stay|suites?)\b/.test(lower);
  const boosts: Partial<Record<Kind, number>> = {};
  if (asksWhere) Object.assign(boosts, { room: 1.25, nearby: 1.1, venue: 1.1 });
  if (asksWhen) Object.assign(boosts, { event: 1.5 });
  if (
    /\b(near|nearby|around|close|closest|walking)\b/.test(lower) ||
    /\bcan i (eat|buy|get|find)\b/.test(lower) ||
    tokenize(question).length <= 2
  ) {
    boosts.nearby = (boosts.nearby ?? 1) * 1.8;
  }
  if (asksHotel) Object.assign(boosts, { hotel: 1.2 });

  const ranked: Ranked[] = [];
  for (const doc of index.docs) {
    let score = 0;
    const norm = 1 - b + (b * doc.length) / index.avgLength;
    const part = (t: string, weight: number, cap = Infinity) => {
      const tf = doc.counts.get(t);
      if (tf) score += weight * Math.min(idf(t), cap) * ((tf * (k1 + 1)) / (tf + k1 * norm));
    };
    for (const t of termSet) part(t, 1);
    for (const [t, cap] of synonymTerms) part(t, 0.5, cap);
    if (score <= 0) continue;

    let phrase = false;
    if (doc.titleTokens.length >= 2) {
      const matched = doc.titleTokens.filter((t) => termSet.has(t)).length;
      const fraction = matched / doc.titleTokens.length;
      if (matched >= 2 && fraction >= 0.5) {
        score += 3 + 2 * fraction;
        phrase = fraction === 1;
      }
    }
    score *= boosts[doc.kind] ?? 1;
    ranked.push({ doc, score, phrase });
  }
  ranked.sort((a, b2) => b2.score - a.score);
  return { ranked: ranked.slice(0, limit), unknown };
}

/** Compact context for the AI model: the best-matching entries for a question. */
export function relevantKnowledge(question: string): string {
  return rank(question, 7)
    .ranked.map(({ doc }) => `${doc.title}\n${doc.answer}`)
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Answer builders
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "What's on Tuesday?",
  "What's happening at 2pm?",
  "Who is giving the keynote?",
  "When is the gala night?",
  "Which hotel is closest to the venue?",
  "Where is the media room?",
  "What's the Wi-Fi password?",
  "Where can I eat near the venue?",
];

const TOPICS =
  "the **schedule** (by day or time), **speakers**, **venue and rooms**, **hotels**, **shuttles**, **nearby places**, **Wi-Fi** and **emergency contacts**";

function suggestionList(items: string[]): string {
  return items.map((s) => `- ${s}`).join("\n");
}

function fallback(extra?: string): string {
  return [
    extra ?? "I couldn't find that in the conference information I have offline.",
    `I can help with ${TOPICS}. For example:`,
    suggestionList(SUGGESTIONS.slice(0, 4)),
    `For anything else, contact the secretariat: ${EVENT_CONFIG.primaryHotline} or ${EVENT_CONFIG.email}.`,
  ].join("\n\n");
}

function sortedEvents(dayIndex: number) {
  return conferenceSchedule[dayIndex].events
    .map((event) => ({ event, range: eventRange(event) }))
    .sort((a, b) => (a.range?.start ?? 9999) - (b.range?.start ?? 9999));
}

function eventLine({ event }: { event: ConferenceScheduleEvent }): string {
  return `- **${event.time}** · ${event.title}${event.location ? ` (${event.location})` : ""}`;
}

function dayAnswer(dayIndex: number, question: string): string {
  const lower = question.toLowerCase();
  let items = sortedEvents(dayIndex);
  let label = "";
  const window = /\bmorning\b/.test(lower)
    ? ([0, 12 * 60, "morning"] as const)
    : /\bafternoon\b/.test(lower)
      ? ([12 * 60, 17 * 60, "afternoon"] as const)
      : /\b(evening|night)\b/.test(lower)
        ? ([17 * 60, 24 * 60, "evening"] as const)
        : null;
  if (window) {
    const starting = items.filter(
      ({ range }) => range && range.start >= window[0] && range.start < window[1],
    );
    const filtered = starting.length
      ? starting
      : items.filter(({ range }) => range && range.start < window[1] && range.end > window[0]);
    if (filtered.length) {
      items = filtered;
      label = ` (${window[2]})`;
    }
  }
  return `**${conferenceSchedule[dayIndex].date}**${label}\n\n${items.map(eventLine).join("\n")}`;
}

function timeAnswer(minutes: number, dayIndex: number | null): string {
  const clock = formatClock(minutes);
  const at = (index: number) =>
    sortedEvents(index).filter(
      ({ range }) => range && range.start <= minutes && minutes < range.end,
    );

  if (dayIndex !== null) {
    const date = conferenceSchedule[dayIndex].date;
    const current = at(dayIndex);
    if (current.length) {
      return `**${date} — at ${clock}**\n\n${current.map(eventLine).join("\n")}`;
    }
    const next = sortedEvents(dayIndex).find(({ range }) => range && range.start > minutes);
    return next
      ? `Nothing is scheduled at ${clock} on **${date}**. Next up:\n\n${eventLine(next)}`
      : `Nothing is scheduled at ${clock} on **${date}**, and there's nothing later that day.`;
  }

  const sections = conferenceSchedule
    .map((day, index) => ({ day, current: at(index) }))
    .filter(({ current }) => current.length)
    .map(({ day, current }) => `**${day.date}**\n${current.map(eventLine).join("\n")}`);
  return sections.length
    ? `Here's what is on at **${clock}** on each day:\n\n${sections.join("\n\n")}`
    : `Nothing is scheduled at ${clock} on any conference day.`;
}

function hotelLine(hotel: (typeof HOTELS)[number], withRate: boolean): string {
  const rate = minRate(hotel.rooms);
  return `- **${hotel.name}** — ${hotel.distanceToVenue ?? "distance TBC"}${
    withRate && rate ? ` · from N${rate.toLocaleString("en-NG")}` : ""
  }${hotel.contactPhone ? ` · ${hotel.contactPhone}` : ""}`;
}

function hotelListAnswer(question: string): string | null {
  const lower = normalize(question);
  if (!/\b(hotels?|accommodation|lodging|stay|suites?|rooms?)\b/.test(lower)) return null;
  if (/(cheap|budget|afford|lowest|least expensive|economical|low cost)/.test(lower)) {
    const list = HOTELS.filter((h) => minRate(h.rooms) !== undefined)
      .sort((a, b) => minRate(a.rooms)! - minRate(b.rooms)!)
      .slice(0, 5);
    return `The most affordable delegate hotels (lowest room rate first):\n\n${list.map((h) => hotelLine(h, true)).join("\n")}\n\nAsk about any of them by name for full rates.`;
  }
  if (/(closest|nearest|near|walking|short distance|next to|around the venue)/.test(lower)) {
    const list = HOTELS.filter((h) => parseKm(h.distanceToVenue) !== undefined)
      .sort((a, b) => parseKm(a.distanceToVenue)! - parseKm(b.distanceToVenue)!)
      .slice(0, 5);
    return `Delegate hotels closest to the venue:\n\n${list.map((h) => hotelLine(h, true)).join("\n")}\n\nShuttles run from partner hotels — ask "shuttle" for times.`;
  }
  if (/(premier|luxur|best|top|recommend|high end|five star|5 star)/.test(lower)) {
    const list = HOTELS.filter((h) => h.qualityTier === "premier")
      .sort((a, b) => (parseKm(a.distanceToVenue) ?? 99) - (parseKm(b.distanceToVenue) ?? 99))
      .slice(0, 6);
    return `Premier delegate hotels (nearest first):\n\n${list.map((h) => hotelLine(h, true)).join("\n")}`;
  }
  if (/\b(list|all|which|what|any|available|options)\b/.test(lower) && /hotels\b/.test(lower)) {
    return `There are **${HOTELS.length}** delegate hotels. A few by distance:\n\n${[...HOTELS]
      .filter((h) => parseKm(h.distanceToVenue) !== undefined)
      .sort((a, b) => parseKm(a.distanceToVenue)! - parseKm(b.distanceToVenue)!)
      .slice(0, 6)
      .map((h) => hotelLine(h, true))
      .join("\n")}\n\nOpen **Accommodation** in the app for the full list.`;
  }
  return null;
}

function speakerAnswer(question: string): string | null {
  const lower = question.toLowerCase();
  if (!/\b(speakers?|keynotes?|panelists?|moderators?|presenters?|speaking)\b/.test(lower)) {
    return null;
  }
  if (/\bkeynote\b/.test(lower)) {
    const keynote = programmeSpeakers.filter((s) => /keynote/i.test(s.role));
    const slot = conferenceSchedule
      .flatMap((day) => day.events.map((event) => ({ day, event })))
      .flatMap(({ day, event }) =>
        (event.timeline ?? [])
          .filter((t) => /keynote/i.test(t.text))
          .map((t) => `${day.date}, ${t.time} — ${t.text} (${event.title})`),
      )[0];
    if (keynote.length) {
      return `${keynote.map((s) => `**${s.name}** — ${s.role}`).join("\n")}${slot ? `\n\nWhen: ${slot}` : ""}`;
    }
  }
  if (/\b(panel|session)\s*\d\b/.test(lower)) return null;
  if (/\b(who|list|all|which|speakers)\b/.test(lower)) {
    return `Speakers on the programme:\n\n${programmeSpeakers
      .slice(0, 25)
      .map((s) => `- **${s.name}** — ${s.role}`)
      .join("\n")}\n\nOpen **Speakers** in the app for the full list.`;
  }
  return null;
}

const PLACE_INTENT =
  /\b(where|near|nearby|around|buy|get|find|eat|order|try|spot|place|places|shop|sells?|serves?|got|any)\b/;

// Words that describe "a place to go" rather than what the place offers.
const GENERIC_PLACE_TERMS = new Set(
  (
    "near nearby around close closest venue place spot location buy eat drink order try shop store " +
    "market restaurant food meal snack hospital pharmacy police security airport government " +
    "shopping culture hotel icc maiduguri borno plaza street road best good famous open"
  )
    .split(" ")
    .map(stem),
);

/** Places whose name, description or address mention what was asked for (e.g. "suya"). */
function placeSearchAnswer(question: string, top: Ranked | undefined): string | null {
  const lower = normalize(question);
  if (top?.doc.kind !== "nearby" && !PLACE_INTENT.test(lower)) return null;

  const index = getIndex();
  const specific = analyseQuery(question, index).terms.filter(
    (t) => !GENERIC_PLACE_TERMS.has(t) && !/^\d+$/.test(t),
  );
  if (!specific.length) return null;

  const nearbyDocs = index.docs.filter((d) => d.kind === "nearby");
  const exact = (doc: Doc, term: string) => !!doc.meta?.terms?.has(term);
  const related = (doc: Doc, term: string) =>
    exact(doc, term) || [...(SYNONYMS.get(term) ?? [])].some((s) => doc.meta?.terms?.has(s));

  // Exact mentions win; synonyms (e.g. kebab for suya) only apply when nothing matches exactly.
  let matchesTerm = exact;
  let scored = nearbyDocs
    .map((doc) => ({ doc, hits: specific.filter((t) => exact(doc, t)).length }))
    .filter(({ hits }) => hits > 0);
  if (!scored.length) {
    matchesTerm = related;
    scored = nearbyDocs
      .map((doc) => ({ doc, hits: specific.filter((t) => related(doc, t)).length }))
      .filter(({ hits }) => hits > 0);
  }
  if (!scored.length) return null;

  const best = Math.max(...scored.map(({ hits }) => hits));
  const places = scored
    .filter(({ hits }) => hits === best)
    .map(({ doc }) => doc)
    .sort((a, b) => (a.meta?.distanceKm ?? 99) - (b.meta?.distanceKm ?? 99));
  const shown = places.slice(0, 6);
  const matched = specific.filter((t) => places.some((p) => matchesTerm(p, t)));
  const label = matched.map((t) => `**${t}**`).join(" + ");

  return `${places.length === 1 ? "Found 1 place" : `Found ${places.length} places`} matching ${label}${shown.some((p) => p.meta?.distanceKm !== undefined) ? " (closest first)" : ""}:\n\n${shown
    .map((p) => `- ${p.answer.replace(/\n/g, " · ")}`)
    .join(
      "\n",
    )}${places.length > shown.length ? `\n\n…and ${places.length - shown.length} more — open **Nearby** in the app for the full list.` : ""}`;
}

function nearbyListAnswer(top: Ranked): string | null {
  if (top.doc.kind !== "nearby" || top.phrase) return null;
  const category = top.doc.meta?.category;
  if (!category) return null;
  const places = getIndex()
    .docs.filter((d) => d.kind === "nearby" && d.meta?.category === category)
    .sort((a, b) => (a.meta?.distanceKm ?? 99) - (b.meta?.distanceKm ?? 99))
    .slice(0, 6);
  if (places.length < 2) return null;
  return `${category} options near the venue (closest first):\n\n${places
    .map((p) => `- ${p.answer.replace(/\n/g, " · ")}`)
    .join("\n")}`;
}

const FOLLOW_UP =
  /^(and|also|what about|how about|ok|okay|then)\b|\b(it|that|there|they|them|those|these|its|this one)\b/i;

function isFollowUp(question: string): boolean {
  return tokenize(question).length <= 2 || FOLLOW_UP.test(question.trim());
}

/** Answers from the bundled conference data only; used when no AI key is configured. */
export function answerLocally(question: string, history: string[] = []): string {
  const q = question.trim();
  if (!q) return fallback();
  const lower = q.toLowerCase();
  const wordCount = lower.split(/\s+/).length;

  if (
    wordCount <= 5 &&
    /^(hi|hello|hey|good (morning|afternoon|evening)|salam|assalamu)/.test(lower)
  ) {
    return `Hello! I'm the offline conference assistant for ${EVENT_CONFIG.brandName}. I can help with ${TOPICS}. Try:\n\n${suggestionList(SUGGESTIONS.slice(0, 4))}`;
  }
  if (wordCount <= 6 && /\b(thanks|thank you|thx|cheers)\b/.test(lower)) {
    return "You're welcome! Ask me anything else about the conference.";
  }
  if (/\b(what can you (do|help)|who are you|how do you work|what do you know)\b/.test(lower)) {
    return `I'm the conference assistant for ${EVENT_CONFIG.brandName}. I answer from the official programme, speakers, venue plans, hotels and FAQs bundled in this app. I can help with ${TOPICS}.\n\n${suggestionList(SUGGESTIONS)}`;
  }

  const previous = history[history.length - 1] ?? "";
  const followUp = !!previous && isFollowUp(q);
  const effective = followUp ? `${previous} ${q}` : q;

  const transportish = /\b(shuttle|bus|hotel|airport|flight|pickup)\b/.test(lower);
  let dayRef = parseDayRef(q) ?? (followUp ? parseDayRef(previous) : null);
  let clock = parseClockFromQuestion(q) ?? (followUp ? parseClockFromQuestion(previous) : null);

  if (
    clock === null &&
    /\b(now|right now|currently|at the moment)\b/.test(lower) &&
    !transportish
  ) {
    const today = parseDayRef("today");
    if (today && !isNote(today)) {
      clock = lagosNow().minutes;
      dayRef = today;
    }
  }

  const { ranked, unknown } = rank(effective);
  const top = ranked[0];
  const topIsEventMatch = !!top && top.phrase && top.doc.kind === "event";

  if (clock !== null && !transportish && !topIsEventMatch) {
    if (isNote(dayRef)) return `${dayRef.note}\n\n${timeAnswer(clock, null)}`;
    return timeAnswer(clock, dayRef ? dayRef.index : null);
  }

  const hotels = hotelListAnswer(effective);
  if (hotels) return hotels;

  const speakers = speakerAnswer(effective);
  if (speakers && !topIsEventMatch) return speakers;

  if (dayRef && !topIsEventMatch && !transportish) {
    if (isNote(dayRef)) {
      return `${dayRef.note}\n\nFor reference, here's the first day:\n\n${dayAnswer(0, q)}`;
    }
    return dayAnswer(dayRef.index, q);
  }

  const places = placeSearchAnswer(effective, top);
  if (places) return places;

  if (!top || top.score < 1.2) {
    return fallback(
      unknown.length
        ? `I don't have anything about **${unknown.join("**, **")}** in the conference information.`
        : undefined,
    );
  }

  const nearby = nearbyListAnswer(top);
  if (nearby) return nearby;

  const parts = [top.doc.answer];
  const second = ranked.find(
    (r) => r !== top && r.doc.kind !== top.doc.kind && r.score >= top.score * 0.85,
  );
  if (second && !unknown.length) parts.push(second.doc.answer);

  const body = parts.join("\n\n---\n\n");
  return unknown.length
    ? `I don't have anything specific about **${unknown.join("**, **")}**, but this is the closest match:\n\n${body}`
    : body;
}
