import { createFileRoute } from "@tanstack/react-router";
import { ExhibitorsPage } from "@/features/admin/exhibitors";

export const Route = createFileRoute("/_authenticated/admin/exhibitors")({
  component: ExhibitorsPage,
});
