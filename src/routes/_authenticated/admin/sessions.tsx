import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { requireSubRole } from "@/lib/admin-guard";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_CONFIG } from "@/lib/event-config";
import type { ConferenceScheduleCategory } from "@/data/conference-schedule";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";

type ScheduleEvent = Database["public"]["Tables"]["schedule_events"]["Row"];
type ScheduleEventForm = {
  day: number;
  title: string;
  time: string;
  location: string;
  category: ConferenceScheduleCategory | "";
};

const CATEGORIES: { value: ConferenceScheduleCategory; label: string }[] = [
  { value: "technical", label: "Technical Track" },
  { value: "young-engineers", label: "Young Engineers" },
  { value: "spouses", label: "Spouses" },
  { value: "social", label: "Social" },
];

const PROGRAMME_DAYS = (() => {
  const days: { day: number; date: string }[] = [];
  const date = new Date(EVENT_CONFIG.start);
  let day = 1;
  while (date <= EVENT_CONFIG.end) {
    days.push({
      day,
      date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    });
    date.setDate(date.getDate() + 1);
    day += 1;
  }
  return days;
})();

const EMPTY_FORM: ScheduleEventForm = {
  day: 1,
  title: "",
  time: "",
  location: "",
  category: "",
};

export const Route = createFileRoute("/_authenticated/admin/sessions")({
  beforeLoad: () => requireSubRole(["program"]),
  component: AdminSessions,
});

function AdminSessions() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState<ScheduleEventForm>(EMPTY_FORM);

  const {
    data: events = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["admin-schedule-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_events")
        .select("*")
        .order("day")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const refreshSchedule = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-events"] }),
      queryClient.invalidateQueries({ queryKey: ["published-schedule"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-counts"] }),
    ]);
  };

  const save = useMutation({
    mutationFn: async (values: ScheduleEventForm) => {
      const payload = {
        day: values.day,
        title: values.title.trim(),
        time: values.time.trim(),
        location: values.location.trim(),
        category: values.category || null,
      };

      if (editing && editing.day === values.day) {
        const { error } = await supabase
          .from("schedule_events")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        return;
      }

      const { data: lastEvent, error: orderError } = await supabase
        .from("schedule_events")
        .select("sort_order")
        .eq("day", values.day)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (orderError) throw orderError;

      if (editing) {
        const { error } = await supabase
          .from("schedule_events")
          .update({ ...payload, sort_order: (lastEvent?.sort_order ?? 0) + 1 })
          .eq("id", editing.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("schedule_events")
        .insert({ ...payload, sort_order: (lastEvent?.sort_order ?? 0) + 1 });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(editing ? "Programme event updated" : "Programme event added");
      await refreshSchedule();
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: (saveError: Error) => toast.error(saveError.message),
  });

  const remove = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("schedule_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Programme event removed");
      await refreshSchedule();
    },
    onError: (removeError: Error) => toast.error(removeError.message),
  });

  function openNewEvent() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditEvent(event: ScheduleEvent) {
    const category =
      event.category === null
        ? ""
        : CATEGORIES.find((item) => item.value === event.category)?.value;
    if (category === undefined) {
      toast.error("This event has an unsupported programme category.");
      return;
    }

    setEditing(event);
    setForm({
      day: event.day,
      title: event.title,
      time: event.time,
      location: event.location,
      category,
    });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Published programme</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {events.length} events · Changes appear in the attendee schedule
          </p>
        </div>
        <Button size="sm" onClick={openNewEvent}>
          <Plus className="h-4 w-4" /> Add event
        </Button>
      </div>

      {isPending && (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading programme…</p>
      )}
      {error && (
        <Card className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load the published programme: {error.message}. Make sure the latest Supabase
          migration has been applied.
        </Card>
      )}
      {!isPending && !error && events.length === 0 && (
        <Card className="border-0 p-6 text-center text-sm text-muted-foreground shadow-card">
          No programme events yet. Add the first event to publish it to attendees.
        </Card>
      )}

      {PROGRAMME_DAYS.map(({ day, date }) => {
        const dayEvents = events.filter((event) => event.day === day);
        if (dayEvents.length === 0) return null;

        return (
          <section key={day} className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">
              Day {day} · {date}
            </h3>
            {dayEvents.map((event) => (
              <Card key={event.id} className="flex items-center gap-3 border-0 p-3 shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.time}</p>
                  {event.location && (
                    <p className="mt-1 text-xs text-muted-foreground">{event.location}</p>
                  )}
                  {event.category && (
                    <p className="mt-1 text-[11px] capitalize text-primary">
                      {event.category.replaceAll("-", " ")}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${event.title}`}
                  onClick={() => openEditEvent(event)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  aria-label={`Remove ${event.title}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(`Remove "${event.title}" from the published programme?`)) {
                      remove.mutate(event.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </section>
        );
      })}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit programme event" : "Add programme event"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              save.mutate(form);
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="programme-day">Day</Label>
              <select
                id="programme-day"
                value={form.day}
                onChange={(event) => setForm({ ...form, day: Number(event.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {PROGRAMME_DAYS.map((item) => (
                  <option key={item.day} value={item.day}>
                    Day {item.day} · {item.date}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="programme-title">Event title</Label>
              <Input
                id="programme-title"
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="programme-time">Time</Label>
              <Input
                id="programme-time"
                required
                placeholder="e.g. 9:00am - 10:00am"
                value={form.time}
                onChange={(event) => setForm({ ...form, time: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="programme-location">Location</Label>
              <Input
                id="programme-location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="programme-category">Category</Label>
              <select
                id="programme-category"
                value={form.category}
                onChange={(event) => {
                  const value = event.target.value;
                  const category =
                    value === "" ? "" : CATEGORIES.find((item) => item.value === value)?.value;
                  if (category === undefined) {
                    toast.error("Choose a valid programme category.");
                    return;
                  }
                  setForm({ ...form, category });
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">General</option>
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <Button className="w-full" type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Save changes" : "Add event"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
