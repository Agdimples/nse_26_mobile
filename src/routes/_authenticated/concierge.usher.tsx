import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, BellRing } from "lucide-react";
import { toast } from "sonner";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/concierge/usher")({
  component: UsherPage,
});

const REASONS = [
  "General assistance",
  "Accessibility help",
  "Lost item",
  "Translation help",
  "Other",
];

function UsherPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");

  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-usher-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("usher_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("my-usher-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usher_requests", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["my-usher-requests", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("usher_requests").insert({
        user_id: user!.id,
        reason,
        note: note || null,
        location_label: location || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usher requested — someone is on the way.");
      setNote("");
      setLocation("");
      qc.invalidateQueries({ queryKey: ["my-usher-requests", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="pb-16">
      <NsePageHeader
        title="Beckon an Usher"
        subtitle="An event staffer will come to your location"
        backTo="/concierge"
      />

      <div className="space-y-4 px-4 pt-4">


      <Card className="space-y-3 border-0 p-4 shadow-card">
        <div className="space-y-1">
          <Label>Reason</Label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Where are you? (room / row / seat)</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hall A, Row 4, Seat 12" />
        </div>
        <div className="space-y-1">
          <Label>Note (optional)</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything we should know" />
        </div>
        <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="w-full">
          <BellRing className="h-4 w-4" /> {submit.isPending ? "Sending…" : "Call an usher"}
        </Button>
      </Card>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent requests</h3>
        {myRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="space-y-2">
            {myRequests.map((r) => (
              <Card key={r.id} className="border-0 p-3 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{r.reason}</p>
                    {r.location_label && <p className="text-xs text-muted-foreground">📍 {r.location_label}</p>}
                    {r.note && <p className="mt-1 text-xs">{r.note}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: "bg-accent-soft text-warning-foreground",
    acknowledged: "bg-primary-soft text-primary",
    resolved: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };
  return <Badge className={`${tone[status] ?? "bg-muted"} hover:${tone[status]}`}>{status}</Badge>;
}
