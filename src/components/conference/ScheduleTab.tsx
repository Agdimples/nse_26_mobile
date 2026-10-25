import { useEffect, useState } from "react";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EVENT_CONFIG } from "@/lib/event-config";
import { conferenceSchedule, type ConferenceScheduleCategory } from "@/data/conference-schedule";
import { useAuth } from "@/lib/auth";

const CATEGORIES: {
  value: "all" | ConferenceScheduleCategory;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "young-engineers", label: "Young Engineers" },
  { value: "spouses", label: "Spouses" },
  { value: "technical", label: "Technical Sessions" },
  { value: "social", label: "Social" },
];

const CONF_DAYS = (() => {
  const days: { value: number; label: string }[] = [];
  const date = new Date(EVENT_CONFIG.start);
  let day = 1;
  while (date <= EVENT_CONFIG.end) {
    days.push({
      value: day,
      label: `Day ${day} · ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    });
    date.setDate(date.getDate() + 1);
    day += 1;
  }
  return days;
})();

export function ScheduleTab() {
  const [day, setDay] = useState(1);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("all");
  const selectedDay = conferenceSchedule[day - 1] ?? conferenceSchedule[0];
  const { user } = useAuth();
  const [savedAgendas, setSavedAgendas] = useState<Record<string, string[]>>({});
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoadedUserId(null);
      return;
    }

    try {
      const storedAgenda = localStorage.getItem(`schedule-agenda:${user.id}`);
      const eventKeys: unknown = storedAgenda ? JSON.parse(storedAgenda) : [];
      if (!Array.isArray(eventKeys) || !eventKeys.every((key) => typeof key === "string")) {
        throw new Error("Saved agenda data is invalid.");
      }
      setSavedAgendas((current) => ({ ...current, [user.id]: eventKeys }));
    } catch (error) {
      toast.error(
        `Couldn't load your saved activities: ${
          error instanceof Error ? error.message : "Unknown storage error"
        }`,
      );
    } finally {
      setLoadedUserId(user.id);
    }
  }, [user]);

  const savedEventKeys = new Set(user ? (savedAgendas[user.id] ?? []) : []);
  const filteredEvents = selectedDay.events
    .filter((event) => category === "all" || event.category === category)
    .map((event) => ({
      ...event,
      eventKey: `${selectedDay.date}|${event.time}|${event.title}`,
    }));

  function toggleAgenda(eventKey: string, isSaved: boolean) {
    if (!user) return;

    const currentEventKeys = savedAgendas[user.id] ?? [];
    const nextEventKeys = isSaved
      ? currentEventKeys.filter((key) => key !== eventKey)
      : [...currentEventKeys, eventKey];

    try {
      localStorage.setItem(`schedule-agenda:${user.id}`, JSON.stringify(nextEventKeys));
      setSavedAgendas((current) => ({ ...current, [user.id]: nextEventKeys }));
      toast.success(isSaved ? "Removed from agenda" : "Added to your agenda");
    } catch (error) {
      toast.error(
        `Couldn't update your agenda: ${
          error instanceof Error ? error.message : "Unknown storage error"
        }`,
      );
    }
  }

  return (
    <>
      <div className="border-t border-border bg-background/95 px-4 pt-3 backdrop-blur">
        <Tabs value={`${day}`} onValueChange={(value) => setDay(Number(value))}>
          <TabsList className="flex w-full justify-start gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CONF_DAYS.map((item) => (
              <TabsTrigger key={item.value} value={`${item.value}`} className="shrink-0">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs
          value={category}
          onValueChange={(value) => setCategory(value as (typeof CATEGORIES)[number]["value"])}
          className="mt-3"
        >
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="shrink-0 px-2 text-xs">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3 px-4 py-4">
        {!user && (
          <p className="text-center text-xs text-muted-foreground">
            Sign in to bookmark activities.
          </p>
        )}
        {filteredEvents.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No events in this category for this day.
          </p>
        )}
        {filteredEvents.map((event, index) => {
          const isSaved = savedEventKeys.has(event.eventKey);
          return (
            <Card
              key={`${event.eventKey}-${index}`}
              className="overflow-hidden rounded-2xl border-0 bg-surface shadow-card"
            >
              <div className="flex items-start gap-3.5 p-4">
                <div className="w-16 shrink-0 text-xs font-bold leading-tight text-primary">
                  {event.time.split(" - ").map((time, timeIndex) => (
                    <div key={timeIndex}>{time}</div>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold leading-snug">{event.title}</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                      disabled={!user || loadedUserId !== user.id}
                      aria-label={isSaved ? "Remove from agenda" : "Add to agenda"}
                      onClick={() => toggleAgenda(event.eventKey, isSaved)}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <BookmarkPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">📍 {event.location}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
