import { createFileRoute } from "@tanstack/react-router";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { useState, useMemo, useEffect } from "react";
import {
  Bus,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HOTELS, TRANSPORT } from "@/lib/reference";
import type { Bus as BusType } from "@/lib/reference";

export const Route = createFileRoute("/_authenticated/transport")({
  component: TransportPage,
});

// ── Types matching Supabase rows ──────────────────────────────────────────────
interface SupaBus {
  id: string;
  name: string;
  hotel_id: string;
  route_label: string;
  capacity: number;
  marshal_name: string;
  marshal_phone: string;
  pickup_point: string;
}

interface SupaSchedule {
  id: number;
  label: string;
  direction: string;
  time: string;
  sort_order: number;
}

interface SupaConfig {
  default_policy: string;
  policy_descriptions: Record<string, string>;
}

// ── Bay colour cycling (A–J) ──────────────────────────────────────────────────
const BAY_COLOURS: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: "bg-sky-100",    text: "text-sky-700",    ring: "ring-sky-300"    },
  B: { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-300" },
  C: { bg: "bg-amber-100",  text: "text-amber-700",  ring: "ring-amber-300"  },
  D: { bg: "bg-emerald-100",text: "text-emerald-700",ring: "ring-emerald-300"},
  E: { bg: "bg-rose-100",   text: "text-rose-700",   ring: "ring-rose-300"   },
  F: { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-300" },
  G: { bg: "bg-teal-100",   text: "text-teal-700",   ring: "ring-teal-300"   },
  H: { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-300" },
  I: { bg: "bg-pink-100",   text: "text-pink-700",   ring: "ring-pink-300"   },
  J: { bg: "bg-lime-100",   text: "text-lime-700",   ring: "ring-lime-300"   },
};

function bayLetter(pickupPoint: string): string {
  const m = pickupPoint.match(/Bay\s+([A-Z])/i);
  return m ? m[1].toUpperCase() : "?";
}

function bayColour(letter: string) {
  return BAY_COLOURS[letter] ?? { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border" };
}

// ── Direction pill ────────────────────────────────────────────────────────────
function DirectionPill({ direction }: { direction: string }) {
  return direction === "to_venue" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
      <ArrowRight className="h-2.5 w-2.5" /> To ICC
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
      <ArrowLeft className="h-2.5 w-2.5" /> To Hotel
    </span>
  );
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="h-9 w-9 rounded-xl bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-40 rounded bg-muted" />
          <div className="h-2.5 w-24 rounded bg-muted" />
        </div>
        <div className="h-4 w-4 rounded-full bg-muted" />
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}

// ── Map Supabase row → local BusType ─────────────────────────────────────────
function mapBus(b: SupaBus): BusType {
  return {
    id: b.id,
    name: b.name,
    hotelId: b.hotel_id,
    routeLabel: b.route_label,
    capacity: b.capacity,
    marshalName: b.marshal_name,
    marshalPhone: b.marshal_phone,
    pickupPoint: b.pickup_point,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
function TransportPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [buses, setBuses]       = useState<BusType[]>(TRANSPORT.buses);
  const [schedule, setSchedule] = useState(TRANSPORT.scheduleTemplate);
  const [config, setConfig]     = useState<SupaConfig>({
    default_policy:      TRANSPORT.defaultPolicy,
    policy_descriptions: TRANSPORT.policyDescriptions,
  });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");

  // ── Fetch from Supabase ──────────────────────────────────────────────────
  async function fetchTransportData() {
    setLoading(true);
    setError(null);
    try {
      const [busRes, schedRes, cfgRes] = await Promise.all([
        supabase.from("buses").select("*").order("id"),
        supabase.from("schedule_template").select("*").order("sort_order"),
        supabase.from("transport_config").select("*").eq("id", "main").single(),
      ]);

      if (busRes.error)   throw new Error(busRes.error.message);
      if (schedRes.error) throw new Error(schedRes.error.message);
      if (cfgRes.error)   throw new Error(cfgRes.error.message);

      if (busRes.data && busRes.data.length > 0) {
        setBuses((busRes.data as SupaBus[]).map(mapBus));
      }
      if (schedRes.data && schedRes.data.length > 0) {
        setSchedule(
          (schedRes.data as SupaSchedule[]).map((s) => ({
            label:     s.label,
            direction: s.direction as "to_venue" | "to_hotel",
            time:      s.time,
          })),
        );
      }
      if (cfgRes.data) {
        setConfig({
          default_policy:      cfgRes.data.default_policy,
          policy_descriptions: cfgRes.data.policy_descriptions as Record<string, string>,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.warn("[Transport] Supabase fetch failed, using local data:", msg);
      setError(msg);
      // Keep the local JSON fallback already in state — no extra work needed.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTransportData(); }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buses;
    return buses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.routeLabel.toLowerCase().includes(q) ||
        b.marshalName.toLowerCase().includes(q) ||
        b.pickupPoint.toLowerCase().includes(q),
    );
  }, [buses, search]);

  const assignedCount = buses.filter((b) => b.marshalName !== "To be assigned").length;

  const policyDesc =
    config.policy_descriptions[config.default_policy] ??
    TRANSPORT.policyDescriptions[config.default_policy as keyof typeof TRANSPORT.policyDescriptions] ??
    "";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-28">
      <NsePageHeader
        title="Transport"
        subtitle="Delegate shuttle service"
        backTo="/home"
      />

      <div className="space-y-5 px-4 pt-3">

        {/* ── Error banner (non-blocking) ──────────────────────────────── */}
        {error && !loading && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium text-amber-700">
              Showing cached data — could not reach server.
            </p>
            <button
              onClick={fetchTransportData}
              className="flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-700 active:scale-95"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {/* ── Hero stats strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: buses.length,     label: "Buses",     color: "text-primary",     bg: "bg-primary/8"  },
            { value: assignedCount,    label: "Assigned",  color: "text-emerald-600", bg: "bg-emerald-50" },
            { value: schedule.length,  label: "Runs/day",  color: "text-amber-600",   bg: "bg-amber-50"   },
          ].map(({ value, label, color, bg }) => (
            <div
              key={label}
              className={`flex flex-col items-center justify-center rounded-2xl py-3.5 ${bg}`}
            >
              {loading ? (
                <div className="h-7 w-10 rounded bg-muted animate-pulse" />
              ) : (
                <span className={`text-2xl font-extrabold leading-none ${color}`}>{value}</span>
              )}
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Policy card ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Info className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold capitalize text-foreground">
                  {config.default_policy.replace(/_/g, " ")} policy
                </p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                  Active
                </span>
              </div>
              {loading ? (
                <div className="mt-1.5 h-8 w-full rounded bg-muted animate-pulse" />
              ) : (
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {policyDesc}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Daily schedule timeline ───────────────────────────────────── */}
        <section>
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Daily Schedule
          </h3>
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3.5 animate-pulse ${i < 4 ? "border-b border-border" : ""}`}
                  >
                    <div className="w-14 h-3.5 rounded bg-muted ml-auto" />
                    <div className="h-2.5 w-2.5 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 h-3 rounded bg-muted" />
                  </div>
                ))
              : schedule.map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < schedule.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="w-14 shrink-0 text-right">
                      <span className="font-mono text-sm font-extrabold text-foreground">{s.time}</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ${
                          s.direction === "to_venue"
                            ? "bg-primary ring-primary/30"
                            : "bg-emerald-500 ring-emerald-200"
                        }`}
                      />
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                      <DirectionPill direction={s.direction} />
                    </div>
                  </div>
                ))}
          </div>
        </section>

        {/* ── Bus list ─────────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Routes &amp; Marshals
            </h3>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {loading ? "…" : `${filtered.length} of ${buses.length}`}
            </span>
          </div>

          {/* Search */}
          <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 py-2.5 focus-within:border-primary/50 focus-within:bg-background transition-colors">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bus, hotel or marshal…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-semibold text-muted-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cards */}
          <div className="space-y-2.5">
            {/* Loading skeletons */}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
                <Bus className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No buses match your search</p>
              </div>
            )}

            {/* Bus cards */}
            {!loading &&
              filtered.map((bus) => {
                const hotel    = HOTELS.find((h) => h.id === bus.hotelId);
                const assigned = bus.marshalName !== "To be assigned";
                const bay      = bayLetter(bus.pickupPoint);
                const bc       = bayColour(bay);
                const routeShort = bus.routeLabel.replace(/^ICC ↔ /, "");

                return (
                  <div
                    key={bus.id}
                    className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all active:scale-[0.99]"
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Bus className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-foreground">{bus.name}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span className="truncate text-sm font-medium text-foreground">{routeShort}</span>
                        </div>
                        {hotel?.qualityTier && (
                          <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">
                            {hotel.qualityTier}
                            {hotel.distanceToVenue ? ` · ${hotel.distanceToVenue.toLowerCase()} from ICC` : ""}
                          </p>
                        )}
                      </div>
                      {assigned ? (
                        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-400" />
                      )}
                    </div>

                    {/* Card body */}
                    <div className="px-4 py-3 space-y-2.5">
                      {/* Pickup + bay badge */}
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-xs text-muted-foreground">{bus.pickupPoint}</span>
                        <span
                          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ring-1 ${bc.bg} ${bc.text} ${bc.ring}`}
                        >
                          {bay}
                        </span>
                      </div>

                      {/* Marshal + call */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{bus.capacity}</span> seats
                          </span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className={`text-xs font-semibold ${assigned ? "text-foreground" : "text-amber-600"}`}>
                            {assigned ? bus.marshalName : "Marshal TBA"}
                          </span>
                        </div>
                        <a
                          href={`tel:${bus.marshalPhone.replace(/\s+/g, "")}`}
                          aria-label={`Call marshal for ${bus.name}`}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                            assigned
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Phone className="h-3 w-3" />
                          {assigned ? "Call" : "TBA"}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>
    </div>
  );
}
