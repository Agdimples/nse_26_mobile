/**
 * IccRoomDetails — slide-up detail panel for a selected ICC room.
 *
 * Renders as a bottom sheet on mobile and a side panel on md+ screens.
 * Shows: room name, category badge, description, accessibility info,
 * and a list of directly connected rooms.
 */
import { X, MapPin, Accessibility, Link2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, CATEGORY_COLORS, roomById } from "@/data/icc-floors";
import type { IccRoom } from "@/data/icc-floors";

interface Props {
  room: IccRoom | null;
  onClose: () => void;
  onNavigateTo?: (roomId: string) => void;
}

export function IccRoomDetails({ room, onClose, onNavigateTo }: Props) {
  if (!room) return null;

  const colors = CATEGORY_COLORS[room.category];
  const label = CATEGORY_LABELS[room.category];

  const connectedRooms = (room.connectedTo ?? [])
    .map((id) => roomById(id))
    .filter(Boolean) as IccRoom[];

  return (
    <div
      className="animate-in slide-in-from-bottom-4 duration-200 rounded-2xl border border-border bg-white shadow-elevated overflow-hidden"
      role="region"
      aria-label={`Details for ${room.name}`}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: `2px solid ${colors.stroke}22` }}
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Category colour dot */}
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: colors.fill, border: `1.5px solid ${colors.stroke}` }}
          >
            <MapPin className="h-4 w-4" style={{ color: colors.stroke }} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-tight text-foreground truncate">
              {room.name}
            </h2>
            {room.number && (
              <p className="text-xs text-muted-foreground font-mono">#{room.number}</p>
            )}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={onClose}
          aria-label="Close room details"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="space-y-3 px-4 py-3">
        {/* Category badge */}
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            background: colors.fill,
            color: colors.text,
            border: `1px solid ${colors.stroke}55`,
          }}
        >
          {label}
        </span>

        {/* Description */}
        {room.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {room.description}
          </p>
        )}

        {/* Accessibility */}
        {room.accessibility && (
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
            <Accessibility className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-xs text-blue-700 leading-relaxed">{room.accessibility}</p>
          </div>
        )}

        {/* Connected rooms */}
        {connectedRooms.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Connected spaces
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {connectedRooms.map((r) => {
                const c = CATEGORY_COLORS[r.category];
                return (
                  <button
                    key={r.id}
                    onClick={() => onNavigateTo?.(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition hover:opacity-80 active:scale-95"
                    style={{
                      background: c.fill,
                      color: c.text,
                      border: `1px solid ${c.stroke}44`,
                    }}
                    aria-label={`Navigate to ${r.name}`}
                  >
                    {r.name}
                    <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Overlay pending notice */}
        {room.polygon.length < 3 && (
          <p className="text-[11px] text-muted-foreground/60 italic">
            Room boundary not yet mapped — overlay will appear after image export.
          </p>
        )}
      </div>
    </div>
  );
}
