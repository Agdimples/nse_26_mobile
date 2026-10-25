import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatTimeRange, initials } from "@/lib/format";
import {
  ArrowLeft,
  BookmarkPlus,
  BookmarkCheck,
  MapPin,
  Clock,
  Tag,
  ChevronRight,
  LayoutList,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/schedule/$sessionId")({
  component: SessionDetail,
});

const SESSION_TYPE_COLORS: Record<string, string> = {
  keynote:  "bg-accent/15 text-accent border-accent/20",
  workshop: "bg-green-50 text-green-700 border-green-200",
  panel:    "bg-purple-50 text-purple-700 border-purple-200",
  talk:     "bg-primary/8 text-primary border-primary/20",
};

const SESSION_TYPE_STRIPE: Record<string, string> = {
  keynote:  "from-amber-400 to-yellow-500",
  workshop: "from-green-500 to-emerald-600",
  panel:    "from-purple-500 to-violet-600",
  talk:     "from-primary to-blue-700",
};

function SessionDetail() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*, session_speakers(speakers(*))")
        .eq("id", sessionId)
        .maybeSingle();
      return data;
    },
  });

  const { data: agendaRow } = useQuery({
    queryKey: ["my-agenda", user?.id, sessionId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("my_agenda")
        .select("session_id")
        .eq("user_id", user!.id)
        .eq("session_id", sessionId)
        .maybeSingle();
      return data;
    },
  });
  const inAgenda = !!agendaRow;

  const toggle = useMutation({
    mutationFn: async () => {
      if (inAgenda) {
        await supabase.from("my_agenda").delete().eq("user_id", user!.id).eq("session_id", sessionId);
        return false;
      }
      await supabase.from("my_agenda").insert({ user_id: user!.id, session_id: sessionId });
      return true;
    },
    onSuccess: (added) => {
      toast.success(added ? "Added to agenda" : "Removed from agenda");
      qc.invalidateQueries({ queryKey: ["my-agenda"] });
      qc.invalidateQueries({ queryKey: ["my-agenda", user?.id, sessionId] });
    },
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="pb-28">
        <div className="h-56 rounded-b-[32px] bg-muted animate-pulse" />
        <div className="px-4 pt-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <LayoutList className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-semibold text-foreground">Session not found</p>
        <button
          onClick={() => navigate({ to: "/schedule" })}
          className="mt-4 text-xs font-semibold text-primary"
        >
          ← Back to schedule
        </button>
      </div>
    );
  }

  const typeKey = session.session_type ?? "talk";
  const stripeGradient = SESSION_TYPE_STRIPE[typeKey] ?? SESSION_TYPE_STRIPE.talk;
  const typeBadge = SESSION_TYPE_COLORS[typeKey] ?? SESSION_TYPE_COLORS.talk;

  return (
    <div className="pb-28">
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-b-[32px] bg-brand-gradient px-4 pb-8 pt-4 text-white shadow-elevated">
        <div className="hero-sheen pointer-events-none absolute inset-0" />

        {/* Decorative gradient stripe at top */}
        <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${stripeGradient}`} />

        <div className="relative">
          {/* Back button */}
          <button
            onClick={() => navigate({ to: "/schedule" })}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to schedule
          </button>

          {/* Type + track badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {session.session_type && session.session_type !== "talk" && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold capitalize text-white">
                {session.session_type}
              </span>
            )}
            {session.track && (
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                {session.track}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-extrabold leading-tight tracking-tight text-white">
            {session.title}
          </h1>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
              <Clock className="h-3.5 w-3.5" />
              {formatTimeRange(session.starts_at, session.ends_at)}
            </span>
            {session.room && (
              <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="h-3.5 w-3.5" />
                {session.room}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div className="flex gap-2.5 px-4 pt-5">
        <Button
          className="flex-1 rounded-xl gap-2"
          variant={inAgenda ? "secondary" : "default"}
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
        >
          {inAgenda ? (
            <>
              <BookmarkCheck className="h-4 w-4 text-primary" />
              <span className="font-semibold">In your agenda</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4" />
              <span className="font-semibold">Add to agenda</span>
            </>
          )}
        </Button>
        {session.room && (
          <Button variant="outline" className="rounded-xl gap-2 shrink-0" asChild>
            <Link to="/map" search={{ room: session.room }}>
              <MapPin className="h-4 w-4" />
              Map
            </Link>
          </Button>
        )}
      </div>

      {/* ── Content sections ──────────────────────────────────────────────── */}
      <div className="px-4 pt-5 space-y-5">

        {/* About */}
        {session.description && (
          <section>
            <SectionHeading label="About this session" />
            <div className="rounded-2xl bg-white border border-border/50 shadow-card p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {session.description}
              </p>
            </div>
          </section>
        )}

        {/* Details card */}
        <section>
          <SectionHeading label="Session details" />
          <div className="rounded-2xl bg-white border border-border/50 shadow-card overflow-hidden divide-y divide-border">
            <DetailRow icon={<Clock className="h-4 w-4 text-muted-foreground" />} label="Time">
              {formatTimeRange(session.starts_at, session.ends_at)}
            </DetailRow>
            {session.room && (
              <DetailRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Room">
                {session.room}
              </DetailRow>
            )}
            {session.track && (
              <DetailRow icon={<Tag className="h-4 w-4 text-muted-foreground" />} label="Track">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${typeBadge}`}>
                  {session.track}
                </span>
              </DetailRow>
            )}
            {session.session_type && (
              <DetailRow icon={<LayoutList className="h-4 w-4 text-muted-foreground" />} label="Format">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${typeBadge}`}>
                  {session.session_type}
                </span>
              </DetailRow>
            )}
          </div>
        </section>

        {/* Speakers */}
        {session.session_speakers && session.session_speakers.length > 0 && (
          <section>
            <SectionHeading label="Speakers" />
            <div className="space-y-2.5">
              {session.session_speakers.map((ss: { speakers?: Record<string, unknown> | null }) => {
                const sp = ss.speakers as {
                  id: string;
                  name: string;
                  title?: string | null;
                  company?: string | null;
                  avatar_url?: string | null;
                  bio?: string | null;
                } | null;
                if (!sp) return null;
                return (
                  <Link
                    key={sp.id}
                    to="/speakers/$speakerId"
                    params={{ speakerId: sp.id }}
                    className="flex items-center gap-4 rounded-2xl bg-white border border-border/50 shadow-card p-4 transition-shadow hover:shadow-md active:scale-[0.99]"
                  >
                    <Avatar className="h-14 w-14 shrink-0 border-2 border-border shadow-sm">
                      <AvatarImage src={sp.avatar_url ?? undefined} />
                      <AvatarFallback className="text-base font-bold bg-primary-soft text-primary">
                        {initials(sp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{sp.name}</p>
                      {sp.title && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{sp.title}</p>
                      )}
                      {sp.company && (
                        <p className="mt-0.5 text-xs font-semibold text-primary truncate">{sp.company}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SectionHeading({ label }: { label: string }) {
  return (
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      {label}
    </h2>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0">{icon}</span>
      <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{children}</span>
    </div>
  );
}
