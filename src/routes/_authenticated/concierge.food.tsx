import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { ChevronLeft, ShoppingBag, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { NsePageHeader } from "@/components/app/NsePageHeader";

export const Route = createFileRoute("/_authenticated/concierge/food")({
  component: FoodPage,
});

type Cart = Record<string, number>;

function FoodPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart>({});
  const [pickup, setPickup] = useState("");
  const [notes, setNotes] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("sort_order");
      return data ?? [];
    },
  });

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const cartLines = Object.entries(cart)
    .map(([id, qty]) => ({ item: itemMap.get(id), qty }))
    .filter((l) => l.item);
  const totalQty = cartLines.reduce((s, l) => s + l.qty, 0);

  // category id -> current qty in cart
  const categoryQty = useMemo(() => {
    const m: Record<string, number> = {};
    cartLines.forEach((l) => {
      const cid = l.item!.category_id ?? "";
      m[cid] = (m[cid] ?? 0) + l.qty;
    });
    return m;
  }, [cartLines]);

  const place = useMutation({
    mutationFn: async () => {
      if (cartLines.length === 0) throw new Error("Your selection is empty");
      if (!pickup.trim()) throw new Error("Add a pickup location");
      const { data: order, error } = await supabase
        .from("food_orders")
        .insert({
          user_id: user!.id,
          pickup_location: pickup,
          notes: notes || null,
          total_ngn: 0,
        })
        .select("id")
        .single();
      if (error) throw error;
      const payload = cartLines.map((l) => ({
        order_id: order!.id,
        menu_item_id: l.item!.id,
        item_name_snapshot: l.item!.name,
        quantity: l.qty,
        unit_price_ngn: 0,
      }));
      const { error: e2 } = await supabase.from("food_order_items").insert(payload);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Order placed!");
      setCart({});
      setPickup("");
      setNotes("");
      setSheetOpen(false);
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      navigate({ to: "/concierge/orders" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function bump(itemId: string, delta: number, categoryId: string | null, itemMax: number) {
    setCart((c) => {
      const current = c[itemId] ?? 0;
      const next = current + delta;
      const out = { ...c };
      if (next <= 0) {
        delete out[itemId];
        return out;
      }
      if (next > itemMax) {
        toast.error(itemMax === 1 ? "Only one of this item" : `Max ${itemMax} of this item`);
        return c;
      }
      // One item type per section: if adding a new item, drop any other item
      // already chosen in this section.
      if (current === 0) {
        for (const [id, q] of Object.entries(c)) {
          if (id === itemId || q <= 0) continue;
          const it = itemMap.get(id);
          if (it && (it.category_id ?? "") === (categoryId ?? "")) delete out[id];
        }
      }
      out[itemId] = next;
      return out;
    });
  }

  return (
    <div className="pb-32">
      <NsePageHeader
        title="Food Menu"
        subtitle="Complimentary delegate dining"
        backTo="/concierge"
      >
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-white/80">Pick 1 item per course</span>
          <Link
            to="/concierge/orders"
            className="rounded-full bg-white/20 px-2.5 py-1 font-semibold text-white backdrop-blur transition hover:bg-white/30"
          >
            My orders →
          </Link>
        </div>
      </NsePageHeader>

      <div className="space-y-4 px-4 pt-4">


      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        if (catItems.length === 0) return null;
        const chosen = catItems.find((i) => (cart[i.id] ?? 0) > 0);
        return (
          <section key={cat.id}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.name}
              </h3>
              <Badge variant={chosen ? "secondary" : "outline"} className="text-[10px]">
                {chosen ? "1 of 1 selected" : "Pick one"}
              </Badge>
            </div>
            <div className="space-y-2">
              {catItems.map((it) => {
                const qty = cart[it.id] ?? 0;
                const itemMax = it.max_per_item ?? 1;
                const isOtherChosen = !!chosen && chosen.id !== it.id;
                return (
                  <Card key={it.id} className="flex gap-3 overflow-hidden border-0 p-2 shadow-card">
                    {it.image_url && (
                      <img src={it.image_url} alt={it.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                      <div>
                        <p className="text-sm font-semibold leading-tight">{it.name}</p>
                        {it.description && <p className="line-clamp-2 text-xs text-muted-foreground">{it.description}</p>}
                        {itemMax > 1 && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground">Up to {itemMax} per order</p>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Free</span>
                        {qty > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => bump(it.id, -1, it.category_id, itemMax)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                            <Button size="icon" className="h-7 w-7" disabled={qty >= itemMax} onClick={() => bump(it.id, 1, it.category_id, itemMax)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7" onClick={() => bump(it.id, 1, it.category_id, itemMax)}>
                            <Plus className="h-3 w-3" /> {isOtherChosen ? "Swap in" : "Add"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {totalQty > 0 && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-[640px] -translate-x-1/2 px-4">
              <Button size="lg" className="w-full justify-between shadow-lg">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" /> Review selection ({totalQty})
                </span>
                <span>Free</span>
              </Button>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Your selection</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {cartLines.map((l) => {
                const itemMax = l.item!.max_per_item ?? 1;
                return (
                  <div key={l.item!.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1">{l.item!.name}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => bump(l.item!.id, -1, l.item!.category_id, itemMax)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-semibold">{l.qty}</span>
                    <Button size="icon" className="h-7 w-7" disabled={l.qty >= itemMax} onClick={() => bump(l.item!.id, 1, l.item!.category_id, itemMax)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-3 border-t pt-4">
              <div className="space-y-1">
                <Label>Pickup / delivery location</Label>
                <Input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Hall B foyer, Table 7" />
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, preferences…" />
              </div>
              <p className="text-xs text-muted-foreground">
                Meals are complimentary, provided by the organizers.
              </p>
            </div>
            <SheetFooter className="mt-4">
              <Button className="w-full" onClick={() => place.mutate()} disabled={place.isPending}>
                {place.isPending ? "Placing…" : "Place order"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
      </div>
    </div>
  );
}

