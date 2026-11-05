import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { initials } from "@/lib/format";
import { programmeSpeakers } from "@/data/programme-speakers";

export function SpeakersTab({ showHeader = false }: { showHeader?: boolean }) {
  const { data: speakers = [] } = useQuery({
    queryKey: ["speakers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .order("is_keynote", { ascending: false })
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      {showHeader && (
        <NsePageHeader
          title="Speakers"
          subtitle="Keynote, panel and technical programme contributors"
          backTo="/conference"
        />
      )}
      <div className="space-y-4 px-4 pt-4">
        {speakers.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {speakers.map((speaker) => (
              <Link
                key={speaker.id}
                to="/speakers/$speakerId"
                params={{ speakerId: speaker.id }}
                className="block transition active:scale-[0.98]"
              >
                <Card className="h-full overflow-hidden rounded-2xl border-0 bg-surface p-4 shadow-card transition-shadow hover:shadow-md">
                  <Avatar className="mx-auto h-20 w-20 border-2 border-border shadow-sm">
                    <AvatarImage src={speaker.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary-soft text-base font-bold text-primary">
                      {initials(speaker.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-3 text-center text-sm font-bold leading-tight text-foreground">
                    {speaker.name}
                  </p>
                  {speaker.title && (
                    <p className="mt-1 line-clamp-2 text-center text-[11px] text-muted-foreground">
                      {speaker.title}
                    </p>
                  )}
                  {speaker.company && (
                    <p className="mt-0.5 text-center text-[11px] font-semibold text-primary">
                      {speaker.company}
                    </p>
                  )}
                  {speaker.is_keynote && (
                    <Badge className="mt-2.5 w-full justify-center bg-accent text-[10px] font-semibold text-accent-foreground hover:bg-accent">
                      Keynote Speaker
                    </Badge>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
        {speakers.length === 0 && programmeSpeakers.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Speaker details will be available soon.
          </p>
        ) : (
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Named in the conference programme
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {programmeSpeakers.map((speaker) => (
                <Card key={speaker.name} className="rounded-xl border-0 bg-surface p-3 shadow-card">
                  <p className="text-sm font-bold leading-snug text-foreground">{speaker.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {speaker.role}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
