/**
 * IccFloorSelector — pill-style floor level selector.
 *
 * Renders one pill per floor in the ICC_FLOORS list plus "Site Plan".
 * Active floor is highlighted with the NSE primary colour.
 */
import type { IccFloor } from "@/data/icc-floors";

interface Props {
  floors: IccFloor[];
  activeFloorId: string;
  onSelect: (floorId: string) => void;
}

export function IccFloorSelector({ floors, activeFloorId, onSelect }: Props) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
      role="tablist"
      aria-label="Select floor"
    >
      {floors.map((floor) => {
        const isActive = activeFloorId === floor.id;
        return (
          <button
            key={floor.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(floor.id)}
            className={[
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isActive
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            ].join(" ")}
          >
            {/* Short label pill inside active state */}
            <span
              className={[
                "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold",
                isActive ? "bg-white/20 text-white" : "bg-background text-muted-foreground",
              ].join(" ")}
            >
              {floor.shortLabel}
            </span>
            {floor.label}
          </button>
        );
      })}
    </div>
  );
}
