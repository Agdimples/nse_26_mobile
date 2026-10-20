/**
 * IccRoutePanel — step-by-step indoor navigation between two ICC rooms.
 *
 * Uses BFS over the verified connectedTo graph in icc-floors.ts.
 * Displays each step with floor context, highlights floor-change hops
 * (lifts / stairs), and surfaces a clear message when no route exists.
 *
 * Usage in map.tsx:
 *   <IccRoutePanel onNavigateStep={(roomId) => setSelectedRoomId(roomId)} />
 */
import { useState } from "react";
import {
  Navigation,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  allRooms,
  findRoute,
  floorById,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/data/icc-floors";
import type { RouteResult, RouteNotFound } from "@/data/icc-floors";

interface Props {
  /** Called when the user taps a step — jump to that room on the viewer. */
  onNavigateStep?: (roomId: string) => void;
  /** Currently highlighted room in the viewer — used to pre-fill From. */
  activeRoomId?: string | null;
}

export function IccRoutePanel({ onNavigateStep, activeRoomId }: Props) {
  const rooms = allRooms().filter((r) => r.floorId !== "site");

  const [fromId, setFromId] = useState<string>(activeRoomId ?? "");
  const [toId,   setToId]   = useState<string>("");
  const [result, setResult] = useState<RouteResult | RouteNotFound | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Keep fromId in sync when the viewer selection changes
  // (only if the user hasn't manually overridden it)
  const lastActiveRef = activeRoomId;
  if (activeRoomId && activeRoomId !== lastActiveRef && !fromId) {
    setFromId(activeRoomId);
  }

  function calculate() {
    if (!fromId || !toId) return;
    const res = findRoute(fromId, toId);
    setResult(res);
    setActiveStep(0);
  }

  function clear() {
    setResult(null);
    setFromId(activeRoomId ?? "");
    setToId("");
    setActiveStep(0);
  }

  function handleStepClick(roomId: string, stepIdx: number) {
    setActiveStep(stepIdx);
    onNavigateStep?.(roomId);
  }

  // Group rooms by floor for the select menus
  const groundRooms = rooms.filter((r) => r.floorId === "ground");
  const firstRooms  = rooms.filter((r) => r.floorId === "first");

  return (
    <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Navigation className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-sm font-semibold text-foreground">Get Directions</p>
        {result && (
          <button
            onClick={clear}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground transition"
            aria-label="Clear route"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* From / To selectors */}
      <div className="space-y-2 p-4">
        <RoomSelect
          label="From"
          value={fromId}
          onChange={setFromId}
          groundRooms={groundRooms.map((r) => ({ id: r.id, name: r.name, floor: floorById(r.floorId)?.label ?? r.floorId }))}
          firstRooms={firstRooms.map((r) => ({ id: r.id, name: r.name, floor: floorById(r.floorId)?.label ?? r.floorId }))}
          placeholder="Select starting room…"
        />
        <RoomSelect
          label="To"
          value={toId}
          onChange={setToId}
          groundRooms={groundRooms.map((r) => ({ id: r.id, name: r.name, floor: floorById(r.floorId)?.label ?? r.floorId }))}
          firstRooms={firstRooms.map((r) => ({ id: r.id, name: r.name, floor: floorById(r.floorId)?.label ?? r.floorId }))}
          placeholder="Select destination…"
        />

        <Button
          className="w-full rounded-xl"
          disabled={!fromId || !toId || fromId === toId}
          onClick={calculate}
        >
          <Navigation className="mr-2 h-4 w-4" />
          Find Route
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="border-t border-border">
          {result.found ? (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-2 bg-primary/5 px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs font-semibold text-primary flex-1">
                  Route found — {result.hopCount} step{result.hopCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Steps */}
              <ol className="divide-y divide-border" aria-label="Route steps">
                {result.steps.map((step, idx) => {
                  const room = allRooms().find((r) => r.id === step.roomId);
                  const colors = room ? CATEGORY_COLORS[room.category] : CATEGORY_COLORS.circulation;
                  const isActive = idx === activeStep;
                  const isLast = idx === result.steps.length - 1;

                  return (
                    <li key={step.roomId}>
                      <button
                        className={[
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                          isActive ? "bg-primary/5" : "hover:bg-muted/40",
                        ].join(" ")}
                        onClick={() => handleStepClick(step.roomId, idx)}
                        aria-current={isActive ? "step" : undefined}
                      >
                        {/* Step number / icon */}
                        <span
                          className={[
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            isLast
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground",
                          ].join(" ")}
                        >
                          {isLast ? <MapPin className="h-3 w-3" /> : idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {step.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                            {step.instruction}
                          </p>

                          {/* Floor-change badge */}
                          {step.isFloorChange && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                              <Layers className="h-2.5 w-2.5" />
                              Floor change
                            </span>
                          )}

                          {/* Category chip */}
                          {room && (
                            <span
                              className="mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ml-1"
                              style={{
                                background: colors.fill,
                                color: colors.text,
                                border: `1px solid ${colors.stroke}33`,
                              }}
                            >
                              {CATEGORY_LABELS[room.category]}
                            </span>
                          )}
                        </div>

                        {!isLast && (
                          <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* Note when rooms are unmapped */}
              {result.steps.some((s) => {
                const r = allRooms().find((x) => x.id === s.roomId);
                return r && r.polygon.length < 3;
              }) && (
                <p className="px-4 pb-3 pt-1 text-[11px] text-muted-foreground/60 italic">
                  Some rooms on this route are not yet highlighted on the map
                  — polygon overlays will appear after coordinates are traced.
                </p>
              )}
            </>
          ) : (
            /* No route */
            <div className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-foreground">No route found</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {result.reason}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: grouped room <select>
// ---------------------------------------------------------------------------

interface RoomOption {
  id: string;
  name: string;
  floor: string;
}

interface RoomSelectProps {
  label: string;
  value: string;
  onChange: (id: string) => void;
  groundRooms: RoomOption[];
  firstRooms: RoomOption[];
  placeholder: string;
}

function RoomSelect({
  label,
  value,
  onChange,
  groundRooms,
  firstRooms,
  placeholder,
}: RoomSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "text-foreground appearance-none",
          !value ? "text-muted-foreground" : "",
        ].join(" ")}
        aria-label={label}
      >
        <option value="" disabled>{placeholder}</option>
        <optgroup label="Ground Floor">
          {groundRooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </optgroup>
        <optgroup label="First Floor">
          {firstRooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
