import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatTimeRange, initials } from "@/lib/format";
import { ArrowLeft, Twitter, Linkedin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/speakers/$speakerId")({
  component: SpeakerDetail,
});

function SpeakerDetail() {
  const { speakerId } = Route.useParams();
  const navigate = useNavigate();

  const { data: speaker } = useQuery({
    queryKey: ["speaker", speakerId],
    queryFn: async () => {
      const { data } = await supabase.from("speakers").select("*").eq("id", speakerId).maybeSingle();
      return data;
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["speaker-sessions", speakerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("session_speakers")
        .select("sessions(*)")
        .eq("speaker_id", speakerId);
      return (data ?? []).map((r) => r.sessions).filter(Boolean);
    },
  });

  if (!speaker) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="pb-16">
      <div className="relative overflow-hidden rounded-b-[28px] bg-brand-gradient px-4 pb-8 pt-4 text-white shadow-elevated">
        <div className="hero-sheen pointer-events-none absolute inset-0" />
        <div className="relative">
          <button
            onClick={() => navigate({ to: "/speakers" })}
            className="mb-3 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All speakers
          </button>
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-28 w-28 border-4 border-white/20 shadow-lg">
            <AvatarImage src={speaker.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">{initials(speaker.name)}</AvatarFallback>
          </Avatar>
          <h1 className="mt-4 text-2xl font-bold">{speaker.name}</h1>
          {speaker.title && <p className="mt-1 text-sm text-white/80">{speaker.title}</p>}
          {speaker.company && <p className="text-sm font-medium text-accent">{speaker.company}</p>}
          {speaker.is_keynote && (
            <Badge className="mt-3 bg-accent text-accent-foreground hover:bg-accent">Keynote speaker</Badge>
          )}
          <div className="mt-4 flex gap-3">
            {speaker.twitter && (
              <a href={`https://twitter.com/${speaker.twitter}`} target="_blank" rel="noreferrer" className="text-white/80">
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {speaker.linkedin && (
              <a href={speaker.linkedin} target="_blank" rel="noreferrer" className="text-white/80">
                <Linkedin className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
      </div>

      <div className="space-y-5 px-4 py-5">
        {speaker.bio && (
          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">About</h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{speaker.bio}</p>
          </section>
        )}

        {sessions.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Sessions
            </h3>
            <div className="space-y-2">
              {sessions.map((s) => (
                <Link
                  key={s!.id}
                  to="/schedule/$sessionId"
                  params={{ sessionId: s!.id }}
                  className="block transition active:scale-[0.99]"
                >
                  <Card className="border-0 p-3 shadow-card">
                    <p className="text-sm font-semibold">{s!.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Day {s!.day} · {formatTimeRange(s!.starts_at, s!.ends_at)}
                      {s!.room ? ` · ${s!.room}` : ""}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
