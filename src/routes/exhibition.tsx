import { createFileRoute } from "@tanstack/react-router";
import ExhibitionMap from "@/components/app/ExhibitionMap";
import { MobileShell } from "@/components/app/MobileShell";
import { NsePageHeader } from "@/components/app/NsePageHeader";

export const Route = createFileRoute("/exhibition")({
  component: ExhibitionPage,
});

function ExhibitionPage() {
  return (
    <MobileShell>
      <div className="pb-24">
        <NsePageHeader
          title="Exhibition"
          subtitle="Official conference exhibition booth allocations"
        />
        <ExhibitionMap />
      </div>
    </MobileShell>
  );
}
