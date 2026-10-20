/**
 * IccSitePlan — site overview viewer using the supplied site plan drawing.
 *
 * Reuses IccFloorViewer for all zoom/pan/overlay logic.
 * Adds a facility list below so users can tap a facility to highlight it
 * even before polygon coordinates are traced.
 *
 * The `onOpenFloor` callback lets the parent switch to the Floor Plans tab
 * when the user taps the ICC building facility card, passing the target
 * floor ID (default "ground").
 */
import { useState } from "react";
import { IccFloorViewer } from "./IccFloorViewer";
import { IccRoomDetails } from "./IccRoomDetails";
import { ICC_SITE, CATEGORY_COLORS, CATEGORY_LABELS } from "@/data/icc-floors";
import type { IccRoom } from "@/data/icc-floors";
import { MapPin, Building2 } from "lucide-react";

interface Props {
  /**
   * Called when the user wants to open the ICC building's floor plans.
   * The parent should switch to the "floors" tab and set the floor to `floorId`.
   */
  onOpenFloor?: (floorId: string) => void;
}

export function IccSitePlan({ onOpenFloor }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId,  setHoveredId]  = useState<string | null>(null);

  const selectedRoom = ICC_SITE.rooms.find((r) => r.id === selectedId) ?? null;

  function handleNavigateTo(roomId: string) {
    // If navigating to the ICC building itself, offer to open the floor plans
    if (roomId === "site-icc" && onOpenFloor) {
      onOpenFloor("ground");
      return;
    }
    setSelectedId(roomId);
  }

  return (
    <div className="space-y-3">
      {/* Plan viewer */}
      <IccFloorViewer
        floor={ICC_SITE}
        selectedRoomId={selectedId}
        hoveredRoomId={hoveredId}
        onSelectRoom={(id) => setSelectedId(id)}
        onHoverRoom={setHoveredId}
        height={380}
      />

      {/* Facility list */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <p className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
          Site Facilities
        </p>
        <ul role="list">
          {ICC_SITE.rooms.map((facility, idx) => {
            const colors     = CATEGORY_COLORS[facility.category];
            const isSelected = selectedId === facility.id;
            const isIcc      = facility.id === "site-icc";

            return (
              <li key={facility.id}>
                <button
                  className={[
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/50",
                    idx !== 0 ? "border-t border-border" : "",
                  ].join(" ")}
                  onClick={() => setSelectedId(isSelected ? null : facility.id)}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? "Deselect" : "Select"} ${facility.name}`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: colors.fill, border: `1px solid ${colors.stroke}55` }}
                  >
                    <MapPin className="h-3.5 w-3.5" style={{ color: colors.stroke }} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {facility.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[facility.category]}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </button>

                {/* Inline CTA: open floor plans for the main ICC building */}
                {isSelected && isIcc && onOpenFloor && (
                  <div className="border-t border-border bg-primary/5 px-4 py-2.5 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="flex-1 text-xs text-primary">
                      View the indoor floor plans for this building
                    </p>
                    <button
                      onClick={() => onOpenFloor("ground")}
                      className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition"
                    >
                      Open Floor Plans →
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Room detail panel */}
      {selectedRoom && (
        <IccRoomDetails
          room={selectedRoom}
          onClose={() => setSelectedId(null)}
          onNavigateTo={handleNavigateTo}
        />
      )}
    </div>
  );
}
