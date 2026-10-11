import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { ConciergeBell, UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/_authenticated/waitlist")({
  component: WaitlistPage,
});

function WaitlistPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["wl-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("food_orders")
        .select("*, food_order_items(*)")
        .eq("user_id", user!.id)
        .in("status", ["pending", "preparing", "ready"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: ushers = [] } = useQuery({
    queryKey: ["wl-ushers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("usher_requests")
        .select("*")
        .eq("user_id", user!.id)
        .in("status", ["pending", "acknowledged"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("waitlist-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_orders", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["wl-orders", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "usher_requests", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["wl-ushers", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const total = orders.length + ushers.length;

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Activity & Requests"
        subtitle={
          total === 0
            ? "You're all caught up — no pending requests"
            : `${total} active concierge request${total === 1 ? "" : "s"}`
        }
        backTo="/home"
      />

      <div className="space-y-4 px-4 pt-4">

      <Section title="Usher beckons" icon={ConciergeBell} emptyHref="/concierge/usher" emptyLabel="Beckon an usher">
        {ushers.map((u) => (
          <Card key={u.id} className="border-0 bg-surface rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold capitalize">{u.reason.replace("_", " ")}</p>
                {u.location_label && <p className="text-xs text-muted-foreground">📍 {u.location_label}</p>}
                {u.note && <p className="text-xs text-muted-foreground">{u.note}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(u.created_at)}</p>
              </div>
              <StatusBadge status={u.status} />
            </div>
          </Card>
        ))}
      </Section>

      <Section title="Food orders" icon={UtensilsCrossed} emptyHref="/concierge/food" emptyLabel="Order food">
        {orders.map((o) => (
          <Card key={o.id} className="border-0 bg-surface rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{o.food_order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0} items</p>
                {o.pickup_location && <p className="text-xs text-muted-foreground">📍 {o.pickup_location}</p>}
                {o.food_order_items && o.food_order_items.length > 0 && (
                  <p className="mt-1 text-xs">
                    {o.food_order_items.map((i) => `${i.quantity}× ${i.item_name_snapshot}`).join(", ")}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(o.created_at)}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
          </Card>
        ))}
      </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  emptyHref,
  emptyLabel,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  emptyHref: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some(Boolean) && items.length > 0 && (Array.isArray(children) ? children.length > 0 : true);

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {hasItems ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <Link to={emptyHref} className="block">
          <Card className="border border-dashed border-border bg-transparent p-3 text-center shadow-none">
            <p className="text-xs text-muted-foreground">No active items — <span className="text-primary">{emptyLabel} →</span></p>
          </Card>
        </Link>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: "bg-accent-soft text-warning-foreground",
    requested: "bg-accent-soft text-warning-foreground",
    accepted: "bg-primary-soft text-primary",
    preparing: "bg-primary-soft text-primary",
    in_progress: "bg-primary text-primary-foreground",
    ready: "bg-primary text-primary-foreground",
  };
  return <Badge className={tone[status] ?? "bg-muted"}>{status.replace("_", " ")}</Badge>;
}
