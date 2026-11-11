import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DatabaseZap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEEDERS, type SeedKey } from "@/lib/admin-seed";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SOURCES: Record<
  SeedKey,
  {
    label: string;
    table: "speakers" | "schedule_events" | "accommodations" | "emergency_contacts";
    invalidate: string[];
  }
> = {
  speakers: {
    label: "Speakers",
    table: "speakers",
    invalidate: ["admin-speakers", "speakers", "admin-counts"],
  },
  programme: {
    label: "Programme events",
    table: "schedule_events",
    invalidate: [
      "admin-schedule-events",
      "published-schedule",
      "admin-counts",
      "cc-programme-preview",
    ],
  },
  hotels: {
    label: "Hotels",
    table: "accommodations",
    invalidate: ["admin-hotels", "accommodations"],
  },
  emergency: {
    label: "Emergency contacts",
    table: "emergency_contacts",
    invalidate: ["admin-emergency", "emergency-contacts", "admin-counts"],
  },
};

export function ImportAppData({ keys }: { keys: SeedKey[] }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<SeedKey | "all" | null>(null);

  const { data: counts } = useQuery({
    queryKey: ["admin-import-counts", keys.join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        keys.map(async (k) => {
          const { count } = await supabase
            .from(SOURCES[k].table)
            .select("id", { count: "exact", head: true });
          return [k, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<SeedKey, number>;
    },
  });

  const run = async (targets: SeedKey[], tag: SeedKey | "all") => {
    setBusy(tag);
    try {
      let added = 0;
      for (const k of targets) {
        const res = await SEEDERS[k]();
        added += res.added;
        await Promise.all(
          [...SOURCES[k].invalidate, "admin-import-counts"].map((key) =>
            qc.invalidateQueries({ queryKey: [key] }),
          ),
        );
      }
      toast.success(
        added ? `Imported ${added} new record${added === 1 ? "" : "s"}` : "Already up to date",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-0 p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DatabaseZap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Import app data</h3>
        </div>
        <Button size="sm" disabled={busy !== null} onClick={() => run(keys, "all")}>
          {busy === "all" ? "Importing…" : "Import all"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Loads the conference data bundled in the app into the database so you can edit it here.
        Existing records are never overwritten or duplicated.
      </p>
      <div className="mt-3 divide-y divide-border">
        {keys.map((k) => (
          <div key={k} className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-medium">{SOURCES[k].label}</p>
              <p className="text-xs text-muted-foreground">
                {counts ? `${counts[k]} in database` : "…"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => run([k], k)}
            >
              {busy === k ? "Importing…" : "Import"}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
