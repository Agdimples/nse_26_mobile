import { createFileRoute } from "@tanstack/react-router";
import { requireSubRole } from "@/lib/admin-guard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AdminListShell } from "@/components/admin/AdminListShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Ann = Database["public"]["Tables"]["announcements"]["Row"];

type Priority = "urgent" | "info" | "general";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "general", label: "General — shows in the app" },
  { value: "info", label: "Info — reminder or notice" },
  { value: "urgent", label: "Urgent — red highlight on the home banner" },
];

// Older rows were saved as "normal" / "high".
function toPriority(value: string | null | undefined): Priority {
  if (value === "urgent" || value === "high") return "urgent";
  if (value === "info") return "info";
  return "general";
}

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  beforeLoad: () => requireSubRole(["comms"]),
  component: AdminAnnouncements,
});

function AdminAnnouncements() {
  const qc = useQueryClient();
  const { data: announcements = [] } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
  });

  return (
    <AdminListShell<Ann>
      title="Announcements"
      items={announcements}
      rowTitle={(a) => a.title}
      rowSubtitle={(a) => `${toPriority(a.priority)} · ${new Date(a.created_at).toLocaleString()}`}
      onDelete={(a) => del.mutateAsync(a.id)}
      renderForm={(close, editing) => <AnnouncementForm close={close} editing={editing} />}
    />
  );
}

function AnnouncementForm({ close, editing }: { close: () => void; editing: Ann | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<{ title: string; body: string; priority: Priority }>({
    title: "",
    body: "",
    priority: "general",
  });
  useEffect(() => {
    if (editing)
      setForm({ title: editing.title, body: editing.body, priority: toPriority(editing.priority) });
  }, [editing]);
  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("announcements")
          .update({ ...form, title: form.title.trim(), body: form.body.trim() })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("announcements").insert({
          ...form,
          title: form.title.trim(),
          body: form.body.trim(),
          posted_by: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Announcement updated" : "Announcement posted");
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["latest-announcement"] });
      qc.invalidateQueries({ queryKey: ["home-announcements"] });
      qc.invalidateQueries({ queryKey: ["cc-announcements"] });
      qc.invalidateQueries({ queryKey: ["unread-announcements"] });
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Body</Label>
        <Textarea
          rows={4}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Priority</Label>
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        className="w-full"
        onClick={() => save.mutate()}
        disabled={save.isPending || !form.title.trim() || !form.body.trim()}
      >
        {save.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
