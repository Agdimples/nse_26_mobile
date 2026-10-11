import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/announcements")({
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as { id: string; title: string; body: string; created_at: string }[];
    },
  });

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Announcements"
        subtitle="Official updates from the organisers."
        backTo="/home"
      />
      <div className="space-y-3 px-4 pt-4">
        {isLoading && (
          <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-card">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        )}
        {!isLoading && announcements.length === 0 && (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
              <Megaphone className="h-6 w-6 text-primary" />
            </span>
            <p className="mt-3 text-sm font-bold">No announcements yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Official updates will appear here during the conference.
            </p>
          </div>
        )}
        {announcements.map((a) => (
          <article key={a.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {formatRelative(a.created_at)}
            </p>
            <h2 className="mt-1 text-base font-extrabold leading-snug">{a.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
