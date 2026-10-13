import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from "lucide-react";

/**
 * Interactive vector floor plan of the conference venue interior.
 *
 * Everything is drawn as SVG (true vector — scales crisply, no raster tiles,
 * no Leaflet). Rooms are selectable; the view pans and zooms.
 */

export type VenueSpaceKind = "public" | "hall" | "room" | "open" | "service";

export type VenueSpace = {
  id: string;
  name: string;
  kind: VenueSpaceKind;
  x: number;
  y: number;
  w: number;
  h: number;
};

// Room rectangles on a fixed 1000 x 1400 vector canvas.
export const VENUE_SPACES: VenueSpace[] = [
  { id: "lobby", name: "Main Lobby", kind: "public", x: 330, y: 96, w: 340, h: 150 },
  { id: "grand", name: "Grand Hall", kind: "hall", x: 150, y: 286, w: 700, h: 330 },
  { id: "hallA", name: "Hall A", kind: "hall", x: 110, y: 706, w: 360, h: 290 },
  { id: "hallB", name: "Hall B", kind: "hall", x: 530, y: 706, w: 360, h: 290 },
  { id: "workshop", name: "Workshop Room 1", kind: "room", x: 110, y: 1060, w: 360, h: 230 },
  { id: "courtyard", name: "Courtyard", kind: "open", x: 530, y: 1060, w: 200, h: 230 },
  { id: "rooftop", name: "Rooftop Terrace", kind: "open", x: 750, y: 1060, w: 180, h: 230 },
];

// Supporting (non-interactive) spaces.
const SUPPORT_SPACES: VenueSpace[] = [
  { id: "reg", name: "Registration", kind: "service", x: 700, y: 96, w: 190, h: 150 },
  { id: "wc", name: "Restrooms", kind: "service", x: 140, y: 96, w: 170, h: 150 },
  { id: "service", name: "Service", kind: "service", x: 800, y: 636, w: 110, h: 60 },
];

const FILL: Record<VenueSpaceKind, string> = {
  public: "#E7EDF6",
  hall: "#DCE6F4",
  room: "#E5F3EA",
  open: "#E9F7EC",
  service: "#EEF1F4",
};

const STROKE: Record<VenueSpaceKind, string> = {
  public: "#123E73",
  hall: "#123E73",
  room: "#1E8E3E",
  open: "#16A34A",
  service: "#94A3B8",
};

const ACCENT: Record<VenueSpaceKind, string> = {
  public: "#123E73",
  hall: "#123E73",
  room: "#1E8E3E",
  open: "#16A34A",
  service: "#64748B",
};

const CANVAS_W = 1000;
const CANVAS_H = 1400;

type Props = {
  selected: string | null;
  onSelect: (id: string) => void;
};

export function VenueFloorPlan({ selected, onSelect }: Props) {
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const zoomBy = useCallback((factor: number) => {
    setView((v) => {
      const k = Math.min(4, Math.max(0.6, v.k * factor));
      return { ...v, k };
    });
  }, []);

  const reset = useCallback(() => setView({ x: 0, y: 0, k: 1 }), []);

  function onWheel(e: React.WheelEvent) {
    // Zoom with the wheel; the plan is vector so this stays crisp.
    setView((v) => {
      const k = Math.min(4, Math.max(0.6, v.k * (e.deltaY < 0 ? 1.12 : 0.89)));
      return { ...v, k };
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setView((v) => ({
      ...v,
      x: drag.current!.vx + (e.clientX - drag.current!.x),
      y: drag.current!.vy + (e.clientY - drag.current!.y),
    }));
  }

  function onPointerUp() {
    drag.current = null;
  }

  const all = [...VENUE_SPACES, ...SUPPORT_SPACES];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <div
        className="h-[440px] w-full cursor-grab touch-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="h-full w-full transition-transform duration-100"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: "center",
          }}
          role="img"
          aria-label="Venue indoor floor plan"
        >
          <defs>
            <pattern id="vfp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="url(#vfp-grid)" />

          {/* Outer building shell */}
          <rect
            x="40"
            y="40"
            width={CANVAS_W - 80}
            height={CANVAS_H - 80}
            rx="18"
            fill="#F8FAFC"
            stroke="#123E73"
            strokeWidth="10"
          />

          {/* Rooms */}
          {all.map((s) => {
            const isInteractive = VENUE_SPACES.some((v) => v.id === s.id);
            const isSelected = selected === s.id;
            return (
              <g
                key={s.id}
                onClick={() => isInteractive && onSelect(s.id)}
                className={isInteractive ? "cursor-pointer" : ""}
              >
                <rect
                  x={s.x}
                  y={s.y}
                  width={s.w}
                  height={s.h}
                  rx="10"
                  fill={FILL[s.kind]}
                  stroke={isSelected ? "#C9A227" : STROKE[s.kind]}
                  strokeWidth={isSelected ? 6 : 2.5}
                />
                <text
                  x={s.x + s.w / 2}
                  y={s.y + s.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={s.w < 220 ? 22 : 26}
                  fontWeight="700"
                  fill="#0F172A"
                  style={{ pointerEvents: "none" }}
                >
                  {s.name}
                </text>
                {isInteractive && isSelected && (
                  <circle cx={s.x + s.w / 2} cy={s.y + 24} r="11" fill="#C9A227" stroke="#fff" strokeWidth="2.5" />
                )}
              </g>
            );
          })}

          {/* Central corridor */}
          <rect x="90" y="636" width="700" height="60" rx="8" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
          <text x="440" y="672" textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#64748B" style={{ pointerEvents: "none" }}>
            Main Corridor
          </text>

          {/* Main entrance (top centre): a gap in the wall with an inward arrow */}
          <rect x="450" y="34" width="100" height="16" fill="#F8FAFC" />
          <path d="M500 50 L472 24 L528 24 Z" fill="#123E73" />
          <text x="500" y="84" textAnchor="middle" fontSize="18" fontWeight="700" fill="#123E73" style={{ pointerEvents: "none" }}>
            ENTRANCE
          </text>

          {/* Compass (north up) */}
          <g transform="translate(930,110)">
            <circle r="34" fill="#fff" stroke="#CBD5E1" strokeWidth="2" />
            <path d="M0 -22 L8 6 L0 0 L-8 6 Z" fill="#C0392B" />
            <text y="-24" textAnchor="middle" fontSize="18" fontWeight="700" fill="#123E73">N</text>
          </g>
        </svg>
      </div>

      {/* Vector map controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/95 shadow-md" onClick={() => zoomBy(1.25)} title="Zoom in">
          <ZoomIn className="h-4 w-4 text-primary" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/95 shadow-md" onClick={() => zoomBy(0.8)} title="Zoom out">
          <ZoomOut className="h-4 w-4 text-primary" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/95 shadow-md" onClick={reset} title="Reset view">
          <RotateCcw className="h-4 w-4 text-primary" />
        </Button>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
          <MapPin className="h-3 w-3" />
          Indoor vector map
        </span>
      </div>
    </div>
  );
}
