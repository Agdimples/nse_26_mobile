import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ScheduleTab } from "@/components/conference/ScheduleTab";
import { NsePageHeader } from "@/components/app/NsePageHeader";

export const Route = createFileRoute("/_authenticated/schedule")({
  component: SchedulePage,
});

function SchedulePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const showingChild = /^\/schedule\/[^/]+$/.test(pathname);

  if (showingChild) {
    return <Outlet />;
  }

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Programme & Schedule"
        subtitle="Daily programme and event timings"
        backTo="/conference"
      />
      <ScheduleTab />
    </div>
  );
}
