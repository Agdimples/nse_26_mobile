import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { BellRing, UtensilsCrossed, ReceiptText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/concierge/")({
  component: ConciergeHub,
});

const tiles = [
  {
    to: "/concierge/usher",
    label: "Beckon an Usher",
    desc: "Need help in your session? Call an usher to your seat.",
    icon: BellRing,
    tone: "bg-primary-soft text-primary",
  },
  {
    to: "/concierge/food",
    label: "Food Menu & Orders",
    desc: "Browse the menu, place an order, track status.",
    icon: UtensilsCrossed,
    tone: "bg-accent-soft text-warning-foreground",
  },
  {
    to: "/concierge/orders",
    label: "My Orders & Requests",
    desc: "View status of food orders and active requests.",
    icon: ReceiptText,
    tone: "bg-accent-soft text-warning-foreground",
  },
] as const;

function ConciergeHub() {
  return (
    <div className="pb-12">
      <NsePageHeader
        title="Concierge"
        subtitle="Convenience services & attendee assistance"
        backTo="/home"
      />

      <div className="space-y-3 px-4 pt-4">
        {tiles.map(({ to, label, desc, icon: Icon, tone }) => (
          <Link key={to} to={to} className="block transition active:scale-[0.99]">
            <Card className="flex items-center gap-3 border-0 p-4 shadow-card hover:bg-muted/30">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{desc}</p>
              </div>
              <span className="text-muted-foreground">›</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
