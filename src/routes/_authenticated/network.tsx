import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { initials } from "@/lib/format";
import { Hash, Search, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/network")({
  component: NetworkPage,
});

function NetworkPage() {
  // Child routes (/network/room/$roomId and /network/$userId) replace this
  // list entirely — without this handoff, tapping a chat room or a person
  // navigates but the list stays on screen and nothing appears to happen.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showingChild = /^\/network\/.+/.test(pathname);

  if (showingChild) {
    return <Outlet />;
  }

  const { user } = useAuth();
  const [q, setQ] = useState("");

  const { data: directory = [] } = useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("networking_opt_in", true)
        .order("display_name");
      return (data ?? []).filter((p) => p.id !== user?.id);
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_rooms").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const filtered = directory.filter((p) => {
    const s = q.toLowerCase();
    return (
      !s ||
      p.display_name?.toLowerCase().includes(s) ||
      p.company?.toLowerCase().includes(s) ||
      p.title?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Network"
        subtitle="Connect with fellow attendees"
        backTo="/home"
      />

      <div className="space-y-4 px-4 pt-4">
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/80 p-1">
            <TabsTrigger
              value="rooms"
              className="rounded-lg text-xs font-bold transition-all data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Chat rooms
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="rounded-lg text-xs font-bold transition-all data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              People ({directory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="mt-4 space-y-3">
            {rooms.map((r) => (
              <Link
                key={r.id}
                to="/network/room/$roomId"
                params={{ roomId: r.id }}
                className="block transition active:scale-[0.99]"
              >
                <Card className="flex items-center gap-3.5 border-0 bg-surface p-4 rounded-2xl shadow-card transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-inner">
                    <Hash className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{r.name}</p>
                    {r.description && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.description}</p>
                    )}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="people" className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, company, role…"
                className="h-11 rounded-xl pl-10 text-xs shadow-sm bg-surface"
              />
            </div>

            {filtered.length === 0 ? (
              <Card className="border-0 bg-surface p-8 text-center rounded-2xl shadow-card">
                <p className="text-sm font-semibold text-foreground">
                  {directory.length === 0
                    ? "Directory is warming up"
                    : "No attendees found"}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {directory.length === 0
                    ? "Be among the first delegates to join the directory by enabling networking in your profile."
                    : "Try searching with a different name, organisation, or engineering discipline."}
                </p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((p) => (
                  <Link
                    key={p.id}
                    to="/network/$userId"
                    params={{ userId: p.id }}
                    className="block transition active:scale-[0.99]"
                  >
                    <Card className="flex items-center gap-3.5 border-0 bg-surface p-3.5 rounded-2xl shadow-card transition-shadow hover:shadow-md">
                      <Avatar className="h-12 w-12 border border-border shadow-sm">
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback className="font-bold text-xs bg-primary-soft text-primary">
                          {initials(p.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{p.display_name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {[p.title, p.company].filter(Boolean).join(" · ") || "Conference Delegate"}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
