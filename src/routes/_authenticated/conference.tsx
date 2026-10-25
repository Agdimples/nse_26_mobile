import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Mic2, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/_authenticated/conference")({
  component: ConferencePage,
});

const features = [
  {
    to: "/schedule",
    label: "Programme & Schedule",
    description: "Browse the full conference programme by day and session type.",
    icon: CalendarDays,
    gradient: "from-blue-500 to-blue-700",
    shadow: "shadow-blue-500/35",
    ring: "ring-blue-400/30",
    badge: "5 days",
  },
  {
    to: "/speakers",
    label: "Speakers",
    description: "Meet the keynote lecturers and industry leaders.",
    icon: Mic2,
    gradient: "from-violet-500 to-purple-700",
    shadow: "shadow-violet-500/35",
    ring: "ring-violet-400/30",
    badge: "Event speakers",
  },
  {
    to: "/exhibition",
    label: "Exhibition",
    description: "Explore the exhibition pavilions and available booths.",
    icon: Store,
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/35",
    ring: "ring-emerald-400/30",
    badge: "Interactive",
  },
] as const;

function ConferencePage() {
  return (
    <div className="space-y-5 pb-28">
      <NsePageHeader
        title="Conference"
        subtitle="Programme, speakers and exhibition"
        backTo="/home"
      />

      <div className="mx-4 overflow-hidden rounded-2xl bg-brand-gradient px-4 py-4 text-white shadow-elevated">
        <p className="text-sm font-extrabold leading-tight">
          {EVENT_CONFIG.name} {EVENT_CONFIG.year}
        </p>
        <p className="mt-1 text-xs leading-snug text-white/80">
          Your conference programme, event speakers and exhibition — all in one place.
        </p>
      </div>

      <div className="flex flex-col gap-3.5 px-4">
        {features.map(({ to, label, description, icon: Icon, gradient, shadow, ring, badge }) => (
          <Link key={to} to={to} className="group block transition-transform active:scale-[0.98]">
            <Card className="flex items-center gap-4 overflow-hidden rounded-2xl border-0 bg-surface p-4 shadow-card transition-shadow group-hover:shadow-md">
              <span
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${gradient} shadow-lg ${shadow} ring-2 ${ring}`}
              >
                <Icon className="h-7 w-7 text-white" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold leading-tight text-foreground">
                    {label}
                  </span>
                  <span
                    className={`rounded-full bg-gradient-to-br ${gradient} px-2 py-0.5 text-[10px] font-bold text-white shadow-sm`}
                  >
                    {badge}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {description}
                </span>
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-md ${shadow}`}
              >
                <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <p className="px-4 text-center text-xs text-muted-foreground">
        {EVENT_CONFIG.fullName} · {EVENT_CONFIG.dates}
      </p>
    </div>
  );
}
