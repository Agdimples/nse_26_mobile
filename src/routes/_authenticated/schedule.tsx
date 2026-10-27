import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimeRange, initials } from "@/lib/format";
import { EVENT_CONFIG } from "@/lib/event-config";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  BookmarkPlus,
  BookmarkCheck,
  CalendarDays,
  Users,
  Building2,
  Clock,
  MapPin,
  ChevronRight,
  Mic2,
  LayoutGrid,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/schedule")({
  component: SchedulePage,
});

// ---------------------------------------------------------------------------
// Conference days
// ---------------------------------------------------------------------------

const CONF_DAYS = (() => {
  const days: { value: number; label: string; short: string; date: Date }[] = [];
  const d = new Date(EVENT_CONFIG.start);
  let n = 1;
  while (d <= EVENT_CONFIG.end) {
    days.push({
      value: n,
      short: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      date: new Date(d),
    });
    d.setDate(d.getDate() + 1);
    n++;
  }
  return days;
})();

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

type MainTab = "sessions" | "speakers" | "exhibitors";

const TAB_CONFIG: { value: MainTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { value: "sessions",   label: "Sessions",   Icon: CalendarDays },
  { value: "speakers",   label: "Speakers",   Icon: Mic2 },
  { value: "exhibitors", label: "Exhibitors", Icon: LayoutGrid },
];

function SchedulePage() {
  const [tab, setTab] = useState<MainTab>("sessions");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showingChild = /^\/schedule\/[^/]+$/.test(pathname);

  if (showingChild) return <Outlet />;

  return (
    <div className="pb-28">
      <NsePageHeader
        title="Programme"
        subtitle="Sessions · Speakers · Exhibitors"
        backTo="/home"
      />

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex">
          {TAB_CONFIG.map(({ value, label, Icon }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={[
                  "flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                  active
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground border-b-2 border-transparent hover:text-foreground",
                ].join(" ")}
                aria-selected={active}
                role="tab"
              >
                <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {tab === "sessions"   && <SessionsList />}
      {tab === "speakers"   && <SpeakersList />}
      {tab === "exhibitors" && <ExhibitorsList />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sessions list
// ---------------------------------------------------------------------------

function SessionsList() {
  const [day, setDay] = useState(1);
  const [track, setTrack] = useState("All");
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", day],
    queryFn: async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*, session_speakers(speakers(id,name,avatar_url))")
        .eq("day", day)
        .order("starts_at");
      return data ?? [];
    },
  });

  const { data: agenda = [] } = useQuery({
    queryKey: ["my-agenda", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("my_agenda")
        .select("session_id")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });
  const agendaSet = new Set(agenda.map((a) => a.session_id));

  const toggleAgenda = useMutation({
    mutationFn: async (sessionId: string) => {
      if (agendaSet.has(sessionId)) {
        await supabase.from("my_agenda").delete().eq("user_id", user!.id).eq("session_id", sessionId);
        return false;
      }
      await supabase.from("my_agenda").insert({ user_id: user!.id, session_id: sessionId });
      return true;
    },
    onSuccess: (added) => {
      toast.success(added ? "Added to agenda" : "Removed from agenda");
      qc.invalidateQueries({ queryKey: ["my-agenda"] });
    },
  });

  const tracks = ["All", ...new Set(sessions.map((s) => s.track).filter(Boolean) as string[])];
  const filtered = track === "All" ? sessions : sessions.filter((s) => s.track === track);

  // Group sessions by hour/time block
  const grouped: Record<string, typeof sessions> = {};
  for (const s of filtered) {
    const hour = new Date(s.starts_at).toLocaleTimeString("en-NG", {
      hour: "numeric", hour12: true, timeZone: "Africa/Lagos",
    });
    if (!grouped[hour]) grouped[hour] = [];
    grouped[hour].push(s);
  }

  return (
    <>
      {/* Day selector */}
      <div className="bg-background border-b border-border">
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 py-3">
            {CONF_DAYS.map((d) => {
              const active = day === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => { setDay(d.value); setTrack("All"); }}
                  className={[
                    "flex shrink-0 flex-col items-center rounded-2xl px-4 py-2.5 text-center transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  ].join(" ")}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${active ? "text-white/70" : "text-muted-foreground/70"}`}>
                    Day {d.value}
                  </span>
                  <span className="text-sm font-bold leading-tight">{d.short}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Track filter */}
        {tracks.length > 1 && (
          <ScrollArea className="w-full border-t border-border/60">
            <div className="flex gap-1.5 px-4 py-2.5">
              {tracks.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrack(t)}
                  className={[
                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all",
                    track === t
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Session groups */}
      <div className="px-4 py-4 space-y-6">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No sessions yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Check back closer to the conference.</p>
          </div>
        )}

        {!isLoading && Object.entries(grouped).map(([hour, groupSessions]) => (
          <div key={hour}>
            {/* Time block header */}
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{hour}</span>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Cards */}
            <div className="space-y-2.5">
              {groupSessions.map((s) => {
                const inAgenda = agendaSet.has(s.id);
                const speakers = s.session_speakers
                  ?.map((ss: { speakers?: { name: string } | null }) => ss.speakers?.name)
                  .filter(Boolean) as string[] | undefined;

                return (
                  <div
                    key={s.id}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-card border border-border/50 transition-shadow hover:shadow-md active:scale-[0.99]"
                    onClick={() => navigate({ to: "/schedule/$sessionId", params: { sessionId: s.id } })}
                  >
                    {/* Left accent stripe by type */}
                    <div className={[
                      "absolute left-0 top-0 h-full w-1 rounded-l-2xl",
                      s.session_type === "keynote" ? "bg-accent" :
                      s.session_type === "workshop" ? "bg-green-500" :
                      s.session_type === "panel" ? "bg-purple-500" :
                      "bg-primary",
                    ].join(" ")} />

                    <div className="flex cursor-pointer items-start gap-3 pl-5 pr-3 py-3.5">
                      {/* Time column */}
                      <div className="w-14 shrink-0 pt-0.5">
                        <span className="text-[11px] font-bold text-primary leading-tight block">
                          {new Date(s.starts_at).toLocaleTimeString("en-NG", {
                            hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos"
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight block">
                          {new Date(s.ends_at).toLocaleTimeString("en-NG", {
                            hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos"
                          })}
                        </span>
                      </div>

                      {/* Main content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold leading-snug text-foreground pr-1">
                            {s.title}
                          </h3>
                          <button
                            className="shrink-0 mt-0.5 rounded-full p-1 transition-colors hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAgenda.mutate(s.id);
                            }}
                            aria-label={inAgenda ? "Remove from agenda" : "Add to agenda"}
                          >
                            {inAgenda ? (
                              <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <BookmarkPlus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                          </button>
                        </div>

                        {/* Meta row */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          {s.room && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                              <MapPin className="h-2.5 w-2.5" />
                              {s.room}
                            </span>
                          )}
                          {s.track && (
                            <span className="inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              {s.track}
                            </span>
                          )}
                          {s.session_type && s.session_type !== "talk" && (
                            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                              {s.session_type}
                            </span>
                          )}
                        </div>

                        {/* Speakers row */}
                        {speakers && speakers.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5">
                            {s.session_speakers
                              .slice(0, 3)
                              .map((ss: { speakers?: { id: string; avatar_url?: string | null; name: string } | null }) => (
                              ss.speakers ? (
                                <Avatar key={ss.speakers.id} className="h-5 w-5 border border-white ring-1 ring-border">
                                  <AvatarImage src={ss.speakers.avatar_url ?? undefined} />
                                  <AvatarFallback className="text-[8px] font-bold bg-primary-soft text-primary">
                                    {initials(ss.speakers.name)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : null
                            ))}
                            <span className="text-[11px] text-muted-foreground">
                              {speakers.slice(0, 2).join(", ")}
                              {speakers.length > 2 && ` +${speakers.length - 2}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Speakers list
// ---------------------------------------------------------------------------

function SpeakersList() {
  const { data: speakers = [], isLoading } = useQuery({
    queryKey: ["speakers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("speakers")
        .select("*")
        .order("is_keynote", { ascending: false })
        .order("name");
      return data ?? [];
    },
  });

  const keynote = speakers.filter((s) => s.is_keynote);
  const regular = speakers.filter((s) => !s.is_keynote);

  return (
    <div className="px-4 pb-24 pt-5 space-y-6">
      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Keynote section */}
      {keynote.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Mic2 className="h-3.5 w-3.5 text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Keynote Speakers
            </h2>
          </div>
          <div className="space-y-2.5">
            {keynote.map((sp) => (
              <Link
                key={sp.id}
                to="/speakers/$speakerId"
                params={{ speakerId: sp.id }}
                className="flex items-center gap-4 rounded-2xl bg-white border border-border/50 shadow-card p-4 transition-shadow hover:shadow-md active:scale-[0.99]"
              >
                <Avatar className="h-14 w-14 shrink-0 border-2 border-accent/30 shadow-sm">
                  <AvatarImage src={sp.avatar_url ?? undefined} />
                  <AvatarFallback className="text-base font-bold bg-accent/10 text-accent">
                    {initials(sp.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{sp.name}</p>
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                      Keynote
                    </span>
                  </div>
                  {sp.title && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{sp.title}</p>
                  )}
                  {sp.company && (
                    <p className="mt-0.5 text-xs font-semibold text-primary">{sp.company}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All speakers grid */}
      {regular.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {regular.length} Featured Speakers
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {regular.map((sp) => (
              <Link
                key={sp.id}
                to="/speakers/$speakerId"
                params={{ speakerId: sp.id }}
                className="block rounded-2xl bg-white border border-border/50 shadow-card overflow-hidden transition-shadow hover:shadow-md active:scale-[0.99]"
              >
                <div className="p-4 text-center">
                  <Avatar className="mx-auto h-16 w-16 border-2 border-border shadow-sm">
                    <AvatarImage src={sp.avatar_url ?? undefined} />
                    <AvatarFallback className="text-lg font-bold bg-primary-soft text-primary">
                      {initials(sp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-2.5 text-sm font-bold leading-tight text-foreground line-clamp-2">
                    {sp.name}
                  </p>
                  {sp.title && (
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                      {sp.title}
                    </p>
                  )}
                  {sp.company && (
                    <p className="mt-1 text-[11px] font-semibold text-primary truncate">
                      {sp.company}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isLoading && speakers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Speakers coming soon</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Check back closer to the conference.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exhibitors list
// ---------------------------------------------------------------------------

type ExhibitorRow = {
  id: string;
  company_name: string;
  logo_url?: string | null;
  booth_number?: string | null;
  signage_text?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_approved?: boolean;
};

function ExhibitorsList() {
  const { data: exhibitors = [], isLoading } = useQuery<ExhibitorRow[]>({
    queryKey: ["exhibitors"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("exhibitors")
        .select("id,company_name,logo_url,booth_number,signage_text,contact_name,contact_email,contact_phone,is_approved")
        .order("company_name");
      if (error) { console.warn("exhibitors:", error); return []; }
      return ((data ?? []) as ExhibitorRow[]).filter((e) => e.is_approved !== false);
    },
  });

  return (
    <div className="px-4 pb-24 pt-5">
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && exhibitors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Exhibition hall being set up</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
            Exhibiting companies will appear here as booths are confirmed — check back closer to the conference.
          </p>
        </div>
      )}

      {!isLoading && exhibitors.length > 0 && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {exhibitors.length} Exhibitors & Showcase Stands
            </p>
          </div>
          <div className="space-y-3">
            {exhibitors.map((ex) => (
              <div
                key={ex.id}
                className="flex items-start gap-4 rounded-2xl bg-white border border-border/50 shadow-card p-4"
              >
                <Avatar className="h-12 w-12 shrink-0 border border-border shadow-sm">
                  <AvatarImage src={ex.logo_url ?? undefined} />
                  <AvatarFallback className="text-sm font-bold bg-primary-soft text-primary">
                    {initials(ex.company_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-tight text-foreground">
                      {ex.company_name}
                    </p>
                    {ex.booth_number && (
                      <span className="shrink-0 rounded-lg border border-primary/30 bg-primary/8 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        Booth {ex.booth_number}
                      </span>
                    )}
                  </div>
                  {ex.signage_text && (
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">
                      {ex.signage_text}
                    </p>
                  )}
                  {ex.contact_name && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {ex.contact_name}
                    </p>
                  )}
                  {(ex.contact_email || ex.contact_phone) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ex.contact_phone && (
                        <a
                          href={`tel:${ex.contact_phone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary/90 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Call
                        </a>
                      )}
                      {ex.contact_email && (
                        <a
                          href={`mailto:${ex.contact_email}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary/30 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Email
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
