import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTimeRange, initials } from "@/lib/format";
import { EVENT_CONFIG } from "@/lib/event-config";
import { BookmarkPlus, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { NsePageHeader } from "@/components/app/NsePageHeader";

export const Route = createFileRoute("/_authenticated/schedule")({
  component: SchedulePage,
});

function SchedulePage() {
  const [view, setView] = useState<"sessions" | "speakers" | "exhibitors">("sessions");
  // Deep links hit /schedule/$sessionId directly: render the child detail
  // instead of the tabs + list when a session route is active.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showingChild = /^\/schedule\/[^/]+$/.test(pathname);

  if (showingChild) {
    return <Outlet />;
  }

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Programme & Schedule"
        subtitle="Sessions, timings & keynote speakers"
        backTo="/home"
      >
        <Tabs value={view} onValueChange={(v) => setView(v as "sessions" | "speakers" | "exhibitors")} className="mt-2 w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/25 p-1 text-white">
            <TabsTrigger
              value="sessions"
              className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary"
            >
              Sessions
            </TabsTrigger>
            <TabsTrigger
              value="speakers"
              className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary"
            >
              Speakers
            </TabsTrigger>
            <TabsTrigger
              value="exhibitors"
              className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary"
            >
              Exhibitors
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </NsePageHeader>

      <div className="pt-2">
        {view === "sessions" ? <SessionsList /> : view === "speakers" ? <SpeakersList /> : <ExhibitorsList />}
      </div>
    </div>
  );
}



// Conference days derived from EVENT_CONFIG start/end (Nov 28 - Dec 4 2026).
const CONF_DAYS = (() => {
  const days: { value: number; label: string }[] = [];
  const d = new Date(EVENT_CONFIG.start);
  let n = 1;
  while (d <= EVENT_CONFIG.end) {
    days.push({
      value: n,
      label: `Day ${n} · ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    });
    d.setDate(d.getDate() + 1);
    n += 1;
  }
  return days;
})();

function SessionsList() {
  const [day, setDay] = useState<number>(1);
  const [track, setTrack] = useState<string>("All");
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: sessions = [] } = useQuery({
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
      const { data } = await supabase.from("my_agenda").select("session_id").eq("user_id", user!.id);
      return data ?? [];
    },
  });
  const agendaSet = new Set(agenda.map((a) => a.session_id));

  const toggleAgenda = useMutation({
    mutationFn: async (sessionId: string) => {
      if (agendaSet.has(sessionId)) {
        await supabase.from("my_agenda").delete().eq("user_id", user!.id).eq("session_id", sessionId);
        return { added: false };
      } else {
        await supabase.from("my_agenda").insert({ user_id: user!.id, session_id: sessionId });
        return { added: true };
      }
    },
    onSuccess: ({ added }) => {
      toast.success(added ? "Added to your agenda" : "Removed from agenda");
      qc.invalidateQueries({ queryKey: ["my-agenda"] });
    },
  });

  const tracks = ["All", ...new Set(sessions.map((s) => s.track).filter(Boolean) as string[])];
  const filtered = track === "All" ? sessions : sessions.filter((s) => s.track === track);

  return (
    <>
      <div className="border-t border-border bg-background/95 px-4 pt-3 backdrop-blur">
        <Tabs value={`${day}`} onValueChange={(v) => setDay(Number(v))}>
          <TabsList className="flex w-full justify-start gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CONF_DAYS.map((d) => (
              <TabsTrigger key={d.value} value={`${d.value}`} className="shrink-0">
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ScrollArea className="w-full">
          <div className="flex gap-2 py-3">
            {tracks.map((t) => (
              <button
                key={t}
                onClick={() => setTrack(t)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  track === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-3 px-4 py-4">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No sessions match this filter.</p>
        )}
        {filtered.map((s) => (
          <Card
            key={s.id}
            className="overflow-hidden border-0 bg-surface rounded-2xl shadow-card transition-shadow hover:shadow-md"
            onClick={() => navigate({ to: "/schedule/$sessionId", params: { sessionId: s.id } })}
          >
            <div className="flex cursor-pointer items-start gap-3.5 p-4">
              <div className="w-16 shrink-0 text-xs font-bold leading-tight text-primary">
                {formatTimeRange(s.starts_at, s.ends_at).split(" – ").map((t, i) => (
                  <div key={i}>{t}</div>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold leading-snug">{s.title}</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAgenda.mutate(s.id);
                    }}
                  >
                    {agendaSet.has(s.id) ? (
                      <BookmarkCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  {s.room && <span className="font-medium text-foreground/80">📍 {s.room}</span>}
                  {s.track && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold">
                      {s.track}
                    </Badge>
                  )}
                  {s.session_type !== "talk" && (
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px] capitalize font-medium">
                      {s.session_type}
                    </Badge>
                  )}
                </div>
                {s.session_speakers && s.session_speakers.length > 0 && (
                  <p className="mt-2.5 truncate text-xs font-medium text-muted-foreground">
                    {s.session_speakers.map((ss) => ss.speakers?.name).filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function SpeakersList() {
  const { data: speakers = [] } = useQuery({
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

  return (
    <div className="px-4 pb-24 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {speakers.length} Featured Speakers & Leaders
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {speakers.map((sp) => (
          <Link key={sp.id} to="/speakers/$speakerId" params={{ speakerId: sp.id }} className="block">
            <Card className="overflow-hidden border-0 bg-surface rounded-2xl p-4 shadow-card transition-shadow hover:shadow-md">
              <Avatar className="mx-auto h-20 w-20 border-2 border-border shadow-sm">
                <AvatarImage src={sp.avatar_url ?? undefined} />
                <AvatarFallback className="text-base font-bold bg-primary-soft text-primary">{initials(sp.name)}</AvatarFallback>
              </Avatar>
              <p className="mt-3 text-center text-sm font-bold leading-tight text-foreground">{sp.name}</p>
              {sp.title && (
                <p className="mt-1 line-clamp-2 text-center text-[11px] leading-tight text-muted-foreground">
                  {sp.title}
                </p>
              )}
              {sp.company && (
                <p className="mt-0.5 text-center text-[11px] font-semibold text-primary">{sp.company}</p>
              )}
              {sp.is_keynote && (
                <Badge className="mt-2.5 w-full justify-center bg-accent text-accent-foreground font-bold hover:bg-accent border-0">
                  Keynote
                </Badge>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ExhibitorsList() {
  // The `exhibitors` table is not yet in the generated Database types, so we
  // type it locally — same approach the admin ExhibitorsPage uses.
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
  const { data: exhibitors = [] } = useQuery<ExhibitorRow[]>({
    queryKey: ["exhibitors"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("exhibitors")
        .select("id,company_name,logo_url,booth_number,signage_text,contact_name,contact_email,contact_phone,is_approved")
        .order("company_name");
      if (error) {
        console.warn("Could not fetch exhibitors:", error);
        return [];
      }
      // Show only approved booths; hide anything still pending set-up.
      return ((data ?? []) as ExhibitorRow[]).filter((e) => e.is_approved !== false);
    },
  });

  return (
    <div className="px-4 pb-24 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {exhibitors.length} Exhibitors & Showcase Stands
      </p>
      {exhibitors.length === 0 ? (
        <Card className="mt-4 border-0 bg-surface p-4 shadow-card">
          <p className="text-xs leading-relaxed text-muted-foreground">
            The exhibition hall is being set up. Exhibiting companies will appear here as booths are
            confirmed — check back closer to the conference.
          </p>
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {exhibitors.map((ex) => (
            <Card key={ex.id} className="border-0 bg-surface rounded-2xl p-4 shadow-card">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border border-border shadow-sm">
                  <AvatarImage src={ex.logo_url ?? undefined} />
                  <AvatarFallback className="text-sm font-bold bg-primary-soft text-primary">
                    {initials(ex.company_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold leading-tight text-foreground">{ex.company_name}</p>
                    {ex.booth_number && (
                      <Badge variant="outline" className="shrink-0 text-[10px] font-bold uppercase text-primary">
                        Booth {ex.booth_number}
                      </Badge>
                    )}
                  </div>
                  {ex.signage_text && (
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{ex.signage_text}</p>
                  )}
                  {ex.contact_name && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Contact: {ex.contact_name}
                      {ex.contact_phone ? ` · ${ex.contact_phone}` : ""}
                    </p>
                  )}
                  {(ex.contact_email || ex.contact_phone) && (
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                      {ex.contact_email && (
                        <a href={`mailto:${ex.contact_email}`} className="font-semibold text-primary hover:underline">
                          Email
                        </a>
                      )}
                      {ex.contact_phone && (
                        <a
                          href={`tel:${ex.contact_phone.replace(/\s+/g, "")}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          Call
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
