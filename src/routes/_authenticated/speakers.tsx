import { createFileRoute } from "@tanstack/react-router";
import { SpeakersTab } from "@/components/conference/SpeakersTab";

export const Route = createFileRoute("/_authenticated/speakers")({
  component: () => (
    <div className="pb-24">
      <SpeakersTab showHeader />
    </div>
  ),
});
