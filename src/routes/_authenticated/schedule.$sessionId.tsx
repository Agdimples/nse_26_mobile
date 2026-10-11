import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimeRange, initials } from "@/lib/format";
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Navigation, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/schedule/$sessionId")({
  component: SessionDetail,
});

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

  const { data: agenda } = useQuery({
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

  const toggle = useMutation({
    mutationFn: async () => {
      if (agenda) {
        await supabase.from("my_agenda").delete().eq("user_id", user!.id).eq("session_id", sessionId);
        return false;
      }
      await supabase.from("my_agenda").insert({ user_id: user!.id, session_id: sessionId });
      return true;
    },
    onSuccess: (added) => {
      toast.success(added ? "Added to your agenda" : "Removed from agenda");
      qc.invalidateQueries({ queryKey: ["my-agenda"] });
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!session) return <div className="p-6 text-sm text-muted-foreground">Session not found.</div>;

  return (
    <div className="pb-24">
      <div className="relative overflow-hidden rounded-b-[24px] bg-brand-gradient px-4 pb-6 pt-4 text-white shadow-elevated">
        <div className="hero-sheen pointer-events-none absolute inset-0" />
        <div className="relative">
          <button
            onClick={() => navigate({ to: "/schedule" })}
            className="mb-3 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to schedule
          </button>
          <div className="flex items-start gap-3">
            <img
              src="/nse_crest.png"
              alt="NSE crest"
              className="mt-1 h-9 w-9 shrink-0 rounded-full bg-white p-1 shadow"
            />
            <div className="min-w-0 flex-1">
              {session.track && (
                <Badge className="mb-2 bg-white/15 text-white hover:bg-white/20 border-0">{session.track}</Badge>
              )}
              <h1 className="text-xl font-extrabold leading-tight">{session.title}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80">
                <span>⏱ {formatTimeRange(session.starts_at, session.ends_at)}</span>
                {session.room && <span>📍 {session.room}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => toggle.mutate()}>
            {agenda ? (
              <>
                <BookmarkCheck className="h-4 w-4" /> In your agenda
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" /> Add to agenda
              </>
            )}
          </Button>
          {session.room && (
            <Button variant="outline" asChild>
              <Link to="/map" search={{ room: session.room }}>
                <MapPin className="h-4 w-4" /> Map
              </Link>
            </Button>
          )}
        </div>

        {session.description && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              About Session
            </h3>
            <Card className="border-0 bg-surface rounded-2xl p-4 shadow-card">
              <p className="text-sm leading-relaxed text-muted-foreground">{session.description}</p>
            </Card>
          </section>
        )}

        {session.session_speakers && session.session_speakers.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Session Speakers
            </h3>
            <div className="space-y-2.5">
              {session.session_speakers.map((ss) => {
                const sp = ss.speakers;
                if (!sp) return null;
                return (
                  <Link
                    key={sp.id}
                    to="/speakers/$speakerId"
                    params={{ speakerId: sp.id }}
                    className="flex items-center gap-3.5 rounded-2xl border-0 bg-surface p-3.5 shadow-card transition-shadow hover:shadow-md"
                  >
                    <Avatar className="h-12 w-12 border border-border shadow-sm">
                      <AvatarImage src={sp.avatar_url ?? undefined} />
                      <AvatarFallback className="font-bold text-xs bg-primary-soft text-primary">{initials(sp.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{sp.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[sp.title, sp.company].filter(Boolean).join(" · ")}
                      </p>
                    </div>
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
