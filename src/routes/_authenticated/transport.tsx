import { createFileRoute } from "@tanstack/react-router";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bus,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Users,
} from "lucide-react";
import { TRANSPORT } from "@/lib/reference";
import { HOTELS } from "@/lib/reference";

export const Route = createFileRoute("/_authenticated/transport")({
  component: TransportPage,
});

function TransportPage() {
  const { defaultPolicy, policyDescriptions, buses, scheduleTemplate } = TRANSPORT;

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Transport"
        subtitle={`Delegate shuttles · ${buses.length} buses`}
        backTo="/home"
      />

      <div className="px-4 pt-4">
      {/* Policy card */}
      <Card className="border-0 bg-surface rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Bus className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold capitalize">
            {defaultPolicy.replace(/_/g, " ")} policy
          </p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {policyDescriptions[defaultPolicy]}
        </p>
      </Card>

      {/* Daily schedule */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Daily schedule
        </h3>
        <Card className="border-0 bg-surface rounded-2xl p-4 shadow-card">
          <div className="space-y-2.5">
            {scheduleTemplate.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono text-sm font-bold">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {s.time}
                </span>
                {s.direction === "to_venue" ? (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-success" />
                )}
                <span className="flex-1 text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Buses */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Routes &amp; marshals
        </h3>
        <div className="space-y-2.5">
          {buses.map((bus) => {
            const hotel = HOTELS.find((h) => h.id === bus.hotelId);
            return (
              <Card key={bus.id} className="border-0 bg-surface rounded-2xl p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="shrink-0 text-[10px] font-bold">
                        {bus.name}
                      </Badge>
                      <p className="truncate text-sm font-semibold">
                        {bus.routeLabel.replace(/^ICC ↔ /, "")}
                      </p>
                    </div>
                    {hotel?.qualityTier && (
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {hotel.qualityTier} hotel{hotel.distanceToVenue ? ` · ${hotel.distanceToVenue.toLowerCase()} from venue` : ""}
                      </p>
                    )}
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {bus.pickupPoint}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> {bus.capacity} seats · Marshal:{" "}
                        <span className="font-medium text-foreground">{bus.marshalName}</span>
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild className="shrink-0">
                    <a href={`tel:${bus.marshalPhone.replace(/\s+/g, "")}`} aria-label={`Call ${bus.marshalName}`}>
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
      </div>
    </div>
  );
}
