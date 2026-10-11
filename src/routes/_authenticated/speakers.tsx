import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/speakers")({
  component: SpeakersPage,
});

function SpeakersPage() {
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
    <div className="pb-16">
      <NsePageHeader
        title="Speakers"
        subtitle={`${speakers.length} keynote lecturers & industry leaders`}
        backTo="/schedule"
      />

      <div className="space-y-4 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {speakers.map((sp) => (
            <Link
              key={sp.id}
              to="/speakers/$speakerId"
              params={{ speakerId: sp.id }}
              className="block transition active:scale-[0.98]"
            >
              <Card className="h-full overflow-hidden border-0 p-4 shadow-card hover:bg-muted/30">
                <Avatar className="mx-auto h-20 w-20 border-2 border-border shadow-sm">
                  <AvatarImage src={sp.avatar_url ?? undefined} />
                  <AvatarFallback className="text-base font-semibold">{initials(sp.name)}</AvatarFallback>
                </Avatar>
                <p className="mt-3 text-center text-sm font-bold leading-tight text-foreground">{sp.name}</p>
                {sp.title && (
                  <p className="mt-1 line-clamp-2 text-center text-[11px] text-muted-foreground">
                    {sp.title}
                  </p>
                )}
                {sp.company && (
                  <p className="mt-0.5 text-center text-[11px] font-semibold text-primary">{sp.company}</p>
                )}
                {sp.is_keynote && (
                  <Badge className="mt-2.5 w-full justify-center bg-accent text-accent-foreground hover:bg-accent font-semibold text-[10px]">
                    Keynote Speaker
                  </Badge>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
