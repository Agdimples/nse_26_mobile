import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Megaphone,
  Bell,
  BellDot,
  Clock,
  ChevronDown,
  ChevronUp,
  Pin,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_authenticated/announcements")({
  component: AnnouncementsPage,
});

// ── Types ────────────────────────────────────────────────────────────────────

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
  /** optional fields that may exist in future Supabase schema */
  priority?: "urgent" | "info" | "general" | null;
  pinned?: boolean | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): { label: string; sub: string } {
  const d = new Date(iso);
  const time = format(d, "h:mm a");
  if (isToday(d)) return { label: "Today", sub: time };
  if (isYesterday(d)) return { label: "Yesterday", sub: time };
  return { label: format(d, "EEE, MMM d"), sub: time };
}

function relativeTime(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

const VALID_PRIORITIES = new Set(["urgent", "info", "general"]);

// Derive priority from title keywords when the column doesn't exist yet
function derivePriority(a: Announcement): "urgent" | "info" | "general" {
  if (a.priority && VALID_PRIORITIES.has(a.priority)) return a.priority;
  const text = `${a.title} ${a.body}`.toLowerCase();
  if (/urgent|emergency|critical|immediate|alert/.test(text)) return "urgent";
  if (/reminder|update|notice|announce|inform/.test(text)) return "info";
  return "general";
}

const PRIORITY_META = {
  urgent: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border border-red-200",
    ring: "ring-1 ring-red-200",
    label: "Urgent",
    bar: "bg-red-500",
  },
  info: {
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary border border-primary/20",
    ring: "ring-1 ring-primary/20",
    label: "Info",
    bar: "bg-primary",
  },
  general: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    ring: "",
    label: "General",
    bar: "bg-emerald-500",
  },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function AnnouncementCard({ a }: { a: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  const priority = derivePriority(a);
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.general;
  const { label: dateLabel, sub: timeLabel } = formatTimestamp(a.created_at);
  const isLong = a.body.length > 140;

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all ${meta.ring}`}
    >
      {/* Coloured top accent bar */}
      <div className={`h-0.5 w-full ${meta.bar}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              priority === "urgent"
                ? "bg-red-50"
                : priority === "info"
                  ? "bg-primary/10"
                  : "bg-emerald-50"
            }`}
          >
            {priority === "urgent" ? (
              <BellDot className="h-4.5 w-4.5 text-red-600" />
            ) : (
              <Bell className="h-4.5 w-4.5 text-primary" />
            )}
          </div>

          {/* Meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.badge}`}
              >
                {meta.label}
              </span>
              {a.pinned && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
              <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {dateLabel} · {timeLabel}
              </span>
            </div>

            {/* Title */}
            <h2 className="mt-1.5 text-[15px] font-extrabold leading-snug text-foreground">
              {a.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="mt-2.5 pl-12">
          <p
            className={`text-[13px] leading-relaxed text-muted-foreground transition-all ${
              !expanded && isLong ? "line-clamp-3" : ""
            }`}
          >
            {a.body}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-primary"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Read more
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer: relative time */}
        <div className="mt-3 pl-12 text-[11px] text-muted-foreground/60">
          {relativeTime(a.created_at)}
        </div>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function AnnouncementsPage() {
  const {
    data: announcements = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as Announcement[];
    },
    refetchInterval: 60_000, // poll every minute during the conference
  });

  // Split: pinned first, then rest
  const { pinned, rest } = useMemo(() => {
    const pinned = announcements.filter((a) => a.pinned);
    const rest = announcements.filter((a) => !a.pinned);
    return { pinned, rest };
  }, [announcements]);

  const urgentCount = announcements.filter(
    (a) => derivePriority(a) === "urgent",
  ).length;

  return (
    <div className="min-h-screen bg-background pb-28">
      <NsePageHeader
        title="Announcements"
        subtitle="Official updates from the organisers"
        backTo="/home"
      />

      <div className="space-y-4 px-4 pt-3">

        {/* ── Live indicator strip ─────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[13px] font-semibold text-foreground">
              Live channel
            </span>
            {urgentCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {urgentCount} urgent
              </span>
            )}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Loading skeletons ────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────── */}
        {!isLoading && announcements.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-14 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Megaphone className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">No announcements yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Official updates will appear here during the conference.
              </p>
            </div>
          </div>
        )}

        {/* ── Pinned ───────────────────────────────────────────────── */}
        {pinned.length > 0 && (
          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Pinned
            </h3>
            <div className="space-y-3">
              {pinned.map((a) => (
                <AnnouncementCard key={a.id} a={a} />
              ))}
            </div>
          </section>
        )}

        {/* ── All announcements ────────────────────────────────────── */}
        {rest.length > 0 && (
          <section>
            {pinned.length > 0 && (
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Latest
              </h3>
            )}
            <div className="space-y-3">
              {rest.map((a) => (
                <AnnouncementCard key={a.id} a={a} />
              ))}
            </div>
          </section>
        )}

        {/* ── Total count footer ───────────────────────────────────── */}
        {announcements.length > 0 && (
          <p className="pb-2 text-center text-[11px] text-muted-foreground/60">
            {announcements.length} announcement{announcements.length !== 1 ? "s" : ""} · updates every minute
          </p>
        )}
      </div>
    </div>
  );
}
