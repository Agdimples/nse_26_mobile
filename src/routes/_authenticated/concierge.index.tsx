import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { BellRing } from "lucide-react";

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
] as const;

function ConciergeHub() {
  return (
    <div className="pb-24">
      <NsePageHeader
        title="Concierge"
        subtitle="Convenience services & attendee assistance"
        backTo="/home"
      />

      <div className="space-y-3.5 px-4 pt-4">
        {tiles.map(({ to, label, desc, icon: Icon, tone }) => (
          <Link key={to} to={to} className="block transition active:scale-[0.99]">
            <Card className="flex items-center gap-3.5 border-0 bg-surface p-4 rounded-2xl shadow-card transition-shadow hover:shadow-md">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ${tone}`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <span className="text-sm font-bold">›</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
