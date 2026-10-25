import { createFileRoute } from "@tanstack/react-router";
import ExhibitionMap from "@/components/app/ExhibitionMap";
import { NsePageHeader } from "@/components/app/NsePageHeader";

export const Route = createFileRoute("/_authenticated/exhibition")({
  component: ExhibitionPage,
});

function ExhibitionPage() {
  return (
    <div className="pb-24">
      <NsePageHeader
        title="Exhibition"
        subtitle="Explore the conference exhibition pavilions"
        backTo="/conference"
      />
      <ExhibitionMap />
    </div>
  );
}
