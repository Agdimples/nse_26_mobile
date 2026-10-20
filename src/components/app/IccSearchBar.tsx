/**
 * IccSearchBar — search across all ICC rooms and floors.
 *
 * Searches by room name, category label, room number, or description.
 * Results show which floor each match is on.
 *
 * Keyboard navigation:
 *   ↓ / ↑   — move active result
 *   Enter   — select active result
 *   Escape  — close dropdown
 */
import { useRef, useState, useId } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { searchRooms, CATEGORY_LABELS, CATEGORY_COLORS, floorById } from "@/data/icc-floors";
import type { IccRoom } from "@/data/icc-floors";

interface Props {
  onSelectRoom: (room: IccRoom) => void;
}

const MAX_RESULTS = 12;

export function IccSearchBar({ onSelectRoom }: Props) {
  const [query, setQuery]       = useState("");
  const [open, setOpen]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef   = useRef<HTMLInputElement>(null);
  const listRef    = useRef<HTMLDivElement>(null);
  const listboxId  = useId();

  const visibleResults = query.trim().length >= 1
    ? searchRooms(query).slice(0, MAX_RESULTS)
    : [];

  function handleSelect(room: IccRoom) {
    setQuery("");
    setOpen(false);
    setActiveIdx(-1);
    onSelectRoom(room);
  }

  function handleFocus() { setOpen(true); }

  function handleBlur() {
    // Delay lets mousedown on a result fire first
    setTimeout(() => { setOpen(false); setActiveIdx(-1); }, 150);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || visibleResults.length === 0) {
      if (e.key === "Escape") { setOpen(false); setActiveIdx(-1); }
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = (activeIdx + 1) % visibleResults.length;
        setActiveIdx(next);
        scrollOptionIntoView(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = activeIdx <= 0 ? visibleResults.length - 1 : activeIdx - 1;
        setActiveIdx(prev);
        scrollOptionIntoView(prev);
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (activeIdx >= 0 && visibleResults[activeIdx]) {
          handleSelect(visibleResults[activeIdx]);
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        setOpen(false);
        setActiveIdx(-1);
        break;
      }
    }
  }

  function scrollOptionIntoView(idx: number) {
    if (!listRef.current) return;
    const el = listRef.current.querySelectorAll<HTMLElement>("[role=option]")[idx];
    el?.scrollIntoView({ block: "nearest" });
  }

  const activeOptionId =
    activeIdx >= 0 && visibleResults[activeIdx]
      ? `${listboxId}-opt-${activeIdx}`
      : undefined;

  const isOpen = open && query.trim().length >= 1;

  return (
    <div className="relative">
      {/* Input wrapper */}
      <div className="relative flex items-center overflow-hidden rounded-xl border border-border bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search rooms, facilities…"
          className="flex-1 bg-transparent py-2.5 pl-2 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1); }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-label="Search floor plan rooms and facilities"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            className="mr-2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            onClick={() => { setQuery(""); setActiveIdx(-1); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-border bg-white shadow-elevated"
        >
          {visibleResults.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Search className="h-4 w-4 opacity-40" />
              No rooms match &ldquo;{query}&rdquo;
            </div>
          ) : (
            visibleResults.map((room, idx) => {
              const colors  = CATEGORY_COLORS[room.category];
              const floor   = floorById(room.floorId);
              const isActive = idx === activeIdx;
              return (
                <button
                  key={room.id}
                  id={`${listboxId}-opt-${idx}`}
                  role="option"
                  aria-selected={isActive}
                  className={[
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
                    "first:rounded-t-2xl last:rounded-b-2xl",
                    isActive ? "bg-primary/8 outline-none" : "hover:bg-muted/60",
                  ].join(" ")}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(room); }}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  {/* Category abbr dot */}
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                    style={{
                      background: colors.fill,
                      color: colors.text,
                      border: `1px solid ${colors.stroke}44`,
                    }}
                  >
                    {CATEGORY_LABELS[room.category].slice(0, 2).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {room.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {floor?.label ?? room.floorId} · {CATEGORY_LABELS[room.category]}
                    </p>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
