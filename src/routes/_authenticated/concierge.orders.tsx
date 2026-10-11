import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/concierge/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("food_orders")
        .select("*, food_order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("my-orders")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "food_orders", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["my-orders", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return (
    <div className="pb-16">
      <NsePageHeader
        title="My Orders & Requests"
        subtitle="Track meal orders and concierge requests"
        backTo="/concierge"
      />

      <div className="space-y-4 px-4 pt-4">

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Food orders</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No food orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Card key={o.id} className="border-0 p-3 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{o.food_order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0} items · Complimentary</p>
                    {o.pickup_location && <p className="text-xs text-muted-foreground">📍 {o.pickup_location}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(o.created_at)}</p>
                    {o.food_order_items && o.food_order_items.length > 0 && (
                      <p className="mt-1 text-xs">
                        {o.food_order_items.map((i) => `${i.quantity}× ${i.item_name_snapshot}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <OrderStatusBadge status={o.status} />
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

function OrderStatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: "bg-accent-soft text-warning-foreground",
    preparing: "bg-primary-soft text-primary",
    ready: "bg-primary text-primary-foreground",
    delivered: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return <Badge className={tone[status] ?? "bg-muted"}>{status}</Badge>;
}
