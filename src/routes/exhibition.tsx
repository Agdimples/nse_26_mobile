import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, MapPin, Store } from "lucide-react";
import ExhibitionMap from "@/components/app/ExhibitionMap";
import TripGuide from "@/components/app/TripGuide";
import { MobileShell } from "@/components/app/MobileShell";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ExhibitionView = "floor-plan" | "trip-guide";

export const Route = createFileRoute("/exhibition")({
  validateSearch: (search: Record<string, unknown>): { view?: ExhibitionView } => ({
    view: search.view === "trip-guide" ? "trip-guide" : undefined,
  }),
  component: ExhibitionPage,
});

const GLANCE = [
  { icon: CalendarDays, label: "Opens", value: "Tue 1 Dec, 12:40pm" },
  { icon: MapPin, label: "Venue", value: "ICC, Maiduguri" },
  { icon: Store, label: "Pavilions", value: "4 · Indoor, Outdoor, Market, Food" },
];

function ExhibitionPage() {
  const { view = "floor-plan" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <MobileShell>
      <div className="pb-24">
        <NsePageHeader
          title="Exhibition"
          subtitle="Booth allocations, floor plans and trip guide"
        />

        <div className="space-y-4 px-4 pt-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {GLANCE.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl bg-surface p-3 shadow-card">
                <Icon className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold leading-tight text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <Tabs
            value={view}
            onValueChange={(value) =>
              navigate({ search: { view: value as ExhibitionView }, replace: true })
            }
          >
            <TabsList className="grid h-11 w-full grid-cols-2 bg-muted/70 p-1">
              <TabsTrigger value="floor-plan" className="text-sm font-semibold">
                Floor Plan
              </TabsTrigger>
              <TabsTrigger value="trip-guide" className="text-sm font-semibold">
                Trip Guide
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {view === "trip-guide" ? (
          <div className="px-4 pt-4">
            <TripGuide />
          </div>
        ) : (
          <ExhibitionMap />
        )}
      </div>
    </MobileShell>
  );
}
