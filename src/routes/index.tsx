import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    // The app is members-only: anyone landing on / is routed to the sign-in
    // page; signed-in users go straight into the app.
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/home" : "/auth" });
  },
  head: () => ({
    meta: [
      { title: `${EVENT_CONFIG.name} ${EVENT_CONFIG.year} — ${EVENT_CONFIG.shortName}` },
      { name: "description", content: `Schedule, speakers, venue map, networking, and live directions for ${EVENT_CONFIG.name} ${EVENT_CONFIG.year}.` },
    ],
  }),
});
