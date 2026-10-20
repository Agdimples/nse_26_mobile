/**
 * IccFloorViewer — professional interactive floor-plan viewer.
 *
 * Features:
 *   • Pinch/wheel zoom · Pointer-drag pan · Fit-to-screen · Reset view
 *   • Loading skeleton (shimmer while the plan image loads)
 *   • Hover + selected room highlighting
 *   • Accessible keyboard navigation (arrows / +/−/0 / Tab+Enter)
 *   • Image-not-found placeholder with PDF fallback
 *   • Debug polygon-capture overlay  (?debug=1 in URL)
 *     — click anywhere on the image to record normalised [x,y] coords
 *     — coords are shown as a copyable JSON array in the panel
 *
 * Polygon coordinates are 0–1 normalised fractions of the plan image's
 * rendered pixel size. The SVG overlay scales them live through every
 * zoom/pan state.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ImageOff,
  FileText,
  Crosshair,
  Clipboard,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS } from "@/data/icc-floors";
import type { IccFloor, IccRoom } from "@/data/icc-floors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ViewState {
  tx: number;
  ty: number;
  scale: number;
}

export interface IccFloorViewerProps {
  floor: IccFloor;
  selectedRoomId: string | null;
  hoveredRoomId: string | null;
  onSelectRoom: (id: string | null) => void;
  onHoverRoom: (id: string | null) => void;
  /** Height of the viewer canvas in px. Default 460. */
  height?: number;
  /** Activate the polygon-capture debug overlay. */
  debugMode?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_SCALE = 0.5;
const MAX_SCALE = 6;
const ZOOM_STEP = 1.25;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IccFloorViewer({
  floor,
  selectedRoomId,
  hoveredRoomId,
  onSelectRoom,
  onHoverRoom,
  height = 460,
  debugMode = false,
}: IccFloorViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [view, setView] = useState<ViewState>({ tx: 0, ty: 0, scale: 1 });
  const [imgRendered, setImgRendered] = useState<{ w: number; h: number } | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const pointerRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  // Debug polygon capture state
  const [debugPoints, setDebugPoints] = useState<[number, number][]>([]);
  const [debugCopied, setDebugCopied] = useState(false);

  // Reset loading state when floor changes
  useEffect(() => {
    setImgLoading(true);
    setImgLoaded(false);
    setImgError(false);
    setImgRendered(null);
    setDebugPoints([]);
  }, [floor.id]);

  // ── Fit-to-screen / reset ─────────────────────────────────────────────────
  const fitToScreen = useCallback(() => setView({ tx: 0, ty: 0, scale: 1 }), []);
  const resetView = useCallback(() => setView({ tx: 0, ty: 0, scale: 1 }), []);

  // ── Update rendered image size on load + resize ────────────────────────────
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    const update = () => setImgRendered({ w: img.offsetWidth, h: img.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(img);
    return () => ro.disconnect();
  }, [imgLoaded]);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zoomBy = useCallback((factor: number, cx?: number, cy?: number) => {
    setView((v) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      if (cx == null || cy == null) return { ...v, scale: nextScale };
      const ratio = nextScale / v.scale;
      return {
        scale: nextScale,
        tx: cx - ratio * (cx - v.tx),
        ty: cy - ratio * (cy - v.ty),
      };
    });
  }, []);

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    // preventDefault is called by the native listener registered below.
    // This synthetic handler only handles the zoom logic.
    const rect = containerRef.current!.getBoundingClientRect();
    zoomBy(
      e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP,
      e.clientX - rect.left,
      e.clientY - rect.top,
    );
  }

  // ── Pointer drag ──────────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    pointerRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = pointerRef.current;
    if (!p) return;
    // Capture into local variable before setView — the ref may be nulled
    // by onPointerUp before React's batched updater runs.
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    setView((v) => ({ ...v, tx: p.tx + dx, ty: p.ty + dy }));
  }

  function onPointerUp() { pointerRef.current = null; }

  // ── Pinch zoom ────────────────────────────────────────────────────────────
  function touchDist(t: React.TouchList) {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: touchDist(e.touches), scale: view.scale };
    } else if (e.touches.length === 1) {
      pointerRef.current = {
        x: e.touches[0].clientX, y: e.touches[0].clientY,
        tx: view.tx, ty: view.ty,
      };
    }
  }

  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2 && pinchRef.current) {
      const pinch = pinchRef.current;
      const factor = touchDist(e.touches) / pinch.dist;
      const baseScale = pinch.scale;
      setView((v) => ({
        ...v,
        scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, baseScale * factor)),
      }));
    } else if (e.touches.length === 1 && pointerRef.current) {
      const p = pointerRef.current;
      const dx = e.touches[0].clientX - p.x;
      const dy = e.touches[0].clientY - p.y;
      setView((v) => ({ ...v, tx: p.tx + dx, ty: p.ty + dy }));
    }
  }

  function onTouchEnd() {
    pointerRef.current = null;
    pinchRef.current = null;
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!containerRef.current?.contains(document.activeElement)) return;
      const STEP = 40;
      switch (e.key) {
        case "ArrowUp":    setView((v) => ({ ...v, ty: v.ty + STEP })); break;
        case "ArrowDown":  setView((v) => ({ ...v, ty: v.ty - STEP })); break;
        case "ArrowLeft":  setView((v) => ({ ...v, tx: v.tx + STEP })); break;
        case "ArrowRight": setView((v) => ({ ...v, tx: v.tx - STEP })); break;
        case "+": case "=": zoomBy(ZOOM_STEP); break;
        case "-": zoomBy(1 / ZOOM_STEP); break;
        case "0": resetView(); break;
        default: return;
      }
      e.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomBy, resetView]);

  // ── Non-passive wheel + touchmove (prevents page scroll during zoom/pan) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // React 17+ attaches synthetic wheel/touch listeners as passive by default,
    // so e.preventDefault() inside them is silently ignored. We register native
    // non-passive listeners here to actually block the page scroll.
    const blockScroll = (e: Event) => e.preventDefault();
    el.addEventListener("wheel",     blockScroll, { passive: false });
    el.addEventListener("touchmove", blockScroll, { passive: false });
    return () => {
      el.removeEventListener("wheel",     blockScroll);
      el.removeEventListener("touchmove", blockScroll);
    };
  }, []);

  // ── Debug polygon capture ─────────────────────────────────────────────────
  function onDebugClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!debugMode || !imgRendered || !imgRef.current) return;
    // Find position relative to the image element
    const imgRect = imgRef.current.getBoundingClientRect();
    const fx = (e.clientX - imgRect.left) / imgRect.width;
    const fy = (e.clientY - imgRect.top) / imgRect.height;
    // Clamp to image bounds
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
    setDebugPoints((pts) => [
      ...pts,
      [parseFloat(fx.toFixed(4)), parseFloat(fy.toFixed(4))],
    ]);
  }

  function copyDebugPoints() {
    const json = JSON.stringify(debugPoints);
    navigator.clipboard.writeText(json).then(() => {
      setDebugCopied(true);
      setTimeout(() => setDebugCopied(false), 2000);
    });
  }

  // ── SVG helpers ───────────────────────────────────────────────────────────
  function polygonPoints(room: IccRoom): string | null {
    if (!imgRendered || room.polygon.length < 3) return null;
    // Polygons are normalised 0–1 fractions of the image dimensions.
    // Multiply by the current rendered pixel size to position the overlay.
    return room.polygon
      .map(([fx, fy]) => `${fx * imgRendered.w},${fy * imgRendered.h}`)
      .join(" ");
  }

  function polygonCentroid(room: IccRoom): { x: number; y: number } | null {
    if (!imgRendered || room.polygon.length < 3) return null;
    const pts = room.polygon.map(([fx, fy]) => ({
      x: fx * imgRendered.w, y: fy * imgRendered.h,
    }));
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
  }

  const mappedRooms = floor.rooms.filter((r) => r.polygon.length >= 3);
  const unmappedRooms = floor.rooms.filter((r) => r.polygon.length < 3);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card">

      {/* ── Debug banner ────────────────────────────────────────────────────── */}
      {debugMode && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2">
          <Crosshair className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="flex-1 text-xs font-semibold text-amber-700">
            Debug · polygon capture — click the plan to record points
          </p>
          <span className="text-xs tabular-nums text-amber-600">
            {debugPoints.length} pt{debugPoints.length !== 1 ? "s" : ""}
          </span>
          {debugPoints.length > 0 && (
            <>
              <button
                onClick={copyDebugPoints}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-amber-700"
              >
                <Clipboard className="h-3 w-3" />
                {debugCopied ? "Copied!" : "Copy JSON"}
              </button>
              <button
                onClick={() => setDebugPoints([])}
                className="rounded-lg p-1 text-amber-500 hover:text-amber-700"
                aria-label="Clear points"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-white/95 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"
            onClick={() => zoomBy(ZOOM_STEP)} title="Zoom in (+)" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"
            onClick={() => zoomBy(1 / ZOOM_STEP)} title="Zoom out (-)" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"
            onClick={fitToScreen} title="Fit to screen" aria-label="Fit to screen">
            <Maximize2 className="h-4 w-4 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"
            onClick={resetView} title="Reset view (0)" aria-label="Reset view">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {floor.planPdf && (
            <a href={floor.planPdf} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Open original PDF">
              <FileText className="h-3.5 w-3.5" />
              PDF
            </a>
          )}
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.round(view.scale * 100)}%
          </span>
        </div>
      </div>

      {/* ── Viewer canvas ────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={[
          "relative overflow-hidden bg-slate-50 touch-none",
          debugMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        ].join(" ")}
        style={{ height }}
        tabIndex={0}
        aria-label={`${floor.label} floor plan. Use arrow keys to pan, + / - to zoom.`}
        onWheel={onWheel}
        onPointerDown={debugMode ? undefined : onPointerDown}
        onPointerMove={debugMode ? undefined : onPointerMove}
        onPointerUp={debugMode ? undefined : onPointerUp}
        onPointerLeave={debugMode ? undefined : onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={debugMode ? onDebugClick : undefined}
      >
        {floor.planImage ? (
          <>
            {/* Loading skeleton — shown until image fires onLoad */}
            {imgLoading && !imgError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50">
                {/* Shimmer bars mimicking a floor plan */}
                <div className="w-4/5 max-w-sm space-y-2 animate-pulse">
                  <div className="h-2.5 rounded bg-slate-200" />
                  <div className="flex gap-2">
                    <div className="h-16 flex-1 rounded-lg bg-slate-200" />
                    <div className="h-16 flex-1 rounded-lg bg-slate-200" />
                    <div className="h-16 w-1/3 rounded-lg bg-slate-200" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-12 w-2/3 rounded-lg bg-slate-200" />
                    <div className="h-12 flex-1 rounded-lg bg-slate-200" />
                  </div>
                  <div className="h-2.5 rounded bg-slate-200" />
                  <div className="flex gap-2">
                    <div className="h-20 flex-1 rounded-lg bg-slate-200" />
                    <div className="h-20 flex-1 rounded-lg bg-slate-200" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Loading {floor.label}…</p>
              </div>
            )}

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
                transformOrigin: "center",
                willChange: "transform",
                transition: "transform 0.05s linear",
                // Keep image invisible until loaded to avoid flash of unstyled content
                visibility: imgLoaded ? "visible" : "hidden",
              }}
            >
              {/* Plan image */}
              <img
                ref={imgRef}
                src={floor.planImage}
                alt={`${floor.label} architectural plan`}
                className="block max-h-full max-w-full select-none object-contain"
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImgRendered({ w: img.offsetWidth, h: img.offsetHeight });
                  setImgLoaded(true);
                  setImgLoading(false);
                  setImgError(false);
                }}
                onError={() => {
                  setImgLoading(false);
                  setImgError(true);
                }}
              />

              {/* SVG overlay */}
              {imgLoaded && imgRendered && (
                <svg
                  role="group"
                  aria-label={`${floor.label} room overlays`}
                  className="absolute pointer-events-none"
                  width={imgRendered.w}
                  height={imgRendered.h}
                  style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
                >
                  {/* Room polygons */}
                  {mappedRooms.map((room) => {
                    const pts = polygonPoints(room);
                    if (!pts) return null;
                    const centroid = polygonCentroid(room);
                    const colors = CATEGORY_COLORS[room.category];
                    const isSel = selectedRoomId === room.id;
                    const isHov = hoveredRoomId === room.id;
                    const opacity = isSel ? 0.55 : isHov ? 0.38 : 0.22;
                    return (
                      <g
                        key={room.id}
                        className="pointer-events-auto cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={room.name}
                        aria-pressed={isSel}
                        onClick={() => onSelectRoom(isSel ? null : room.id)}
                        onMouseEnter={() => onHoverRoom(room.id)}
                        onMouseLeave={() => onHoverRoom(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectRoom(isSel ? null : room.id);
                          }
                        }}
                      >
                        <polygon
                          points={pts}
                          fill={colors.fill}
                          fillOpacity={opacity}
                          stroke={colors.stroke}
                          strokeWidth={isSel ? 2.5 : isHov ? 2 : 1.5}
                          strokeOpacity={isSel ? 1 : isHov ? 0.85 : 0.5}
                        />
                        {centroid && (view.scale >= 1.4 || isSel) && (
                          <text
                            x={centroid.x}
                            y={centroid.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={Math.max(8, 11 / view.scale)}
                            fontWeight="600"
                            fill={colors.text}
                            fillOpacity={0.9}
                            style={{ pointerEvents: "none", userSelect: "none" }}
                          >
                            {room.name}
                          </text>
                        )}
                        {isSel && centroid && (
                          <circle cx={centroid.x} cy={centroid.y - 16} r={6}
                            fill="#C9A227" stroke="#fff" strokeWidth={1.5} />
                        )}
                      </g>
                    );
                  })}

                  {/* Debug capture points — purely decorative, hidden from AT */}
                  {debugMode && (
                    <g aria-hidden="true">
                      {debugPoints.map(([fx, fy], i) => (
                        <g key={i}>
                          <circle
                            cx={fx * imgRendered.w}
                            cy={fy * imgRendered.h}
                            r={5}
                            fill="#F59E0B"
                            stroke="#fff"
                            strokeWidth={1.5}
                          />
                          <text
                            x={fx * imgRendered.w + 7}
                            y={fy * imgRendered.h - 3}
                            fontSize={9}
                            fill="#92400E"
                            fontWeight="700"
                            style={{ userSelect: "none" }}
                          >
                            {i + 1}
                          </text>
                        </g>
                      ))}
                      {/* Debug polygon preview line */}
                      {debugPoints.length >= 2 && (
                        <polyline
                          points={debugPoints
                            .map(([fx, fy]) => `${fx * imgRendered.w},${fy * imgRendered.h}`)
                            .join(" ")}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth={1.5}
                          strokeDasharray="4 3"
                          opacity={0.8}
                        />
                      )}
                    </g>
                  )}
                </svg>
              )}
            </div>

            {/* Error fallback */}
            {imgError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <ImageOff className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  Floor plan image not found
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Expected at{" "}
                  <code className="font-mono">{floor.planImage}</code>
                </p>
                {floor.planPdf && (
                  <a
                    href={floor.planPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View original PDF
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <NoPlanPlaceholder floor={floor} />
        )}
      </div>

      {/* ── Debug JSON readout ──────────────────────────────────────────────── */}
      {debugMode && debugPoints.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
            polygon coordinates
          </p>
          <pre className="overflow-x-auto rounded bg-white p-2 text-[11px] text-amber-900 leading-relaxed border border-amber-200">
            {JSON.stringify(debugPoints, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Status bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-border bg-white/80 px-3 py-1.5">
        <p className="text-xs text-muted-foreground">
          {mappedRooms.length > 0
            ? `${mappedRooms.length} mapped room${mappedRooms.length !== 1 ? "s" : ""}`
            : "Room overlays pending image export"}
          {unmappedRooms.length > 0 && mappedRooms.length > 0 && (
            <span className="ml-1 text-muted-foreground/60">
              · {unmappedRooms.length} unmapped
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {debugMode ? "Click to capture points" : "Drag to pan · scroll to zoom"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// No-image placeholder
// ---------------------------------------------------------------------------

function NoPlanPlaceholder({ floor }: { floor: IccFloor }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="relative flex h-32 w-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100">
        <div className="grid grid-cols-3 gap-1.5 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 rounded-sm bg-slate-200"
              style={{ opacity: 0.4 + i * 0.1 }} />
          ))}
        </div>
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-400 border border-slate-200">
          {floor.shortLabel}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{floor.label}</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          Export{" "}
          <code className="font-mono rounded bg-muted px-1">{floor.planPdf}</code> to PNG and
          place it at{" "}
          <code className="font-mono rounded bg-muted px-1">
            {floor.planImage ?? "public/plan/"}
          </code>
        </p>
      </div>
      {floor.planPdf && (
        <a href={floor.planPdf} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90">
          <FileText className="h-3.5 w-3.5" />
          Open {floor.label} PDF
        </a>
      )}
      <p className="text-[11px] text-muted-foreground/50 max-w-xs">
        The original architectural drawing is preserved. Room overlays will be
        activated once the image export is available.
      </p>
    </div>
  );
}
