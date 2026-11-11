import { createFileRoute } from "@tanstack/react-router";
import { requireSubRole } from "@/lib/admin-guard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminListShell } from "@/components/admin/AdminListShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database["public"]["Tables"]["emergency_contacts"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/emergency")({
  beforeLoad: () => requireSubRole(["logistics"]),
  component: AdminEmergency,
});

function AdminEmergency() {
  const qc = useQueryClient();
  const { data: contacts = [] } = useQuery({
    queryKey: ["admin-emergency"],
    queryFn: async () => {
      const { data } = await supabase.from("emergency_contacts").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-emergency"] });
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminListShell<Contact>
      title="Emergency contacts"
      items={contacts}
      rowTitle={(c) => c.label}
      rowSubtitle={(c) => `${c.phone} · ${c.category}`}
      onDelete={(c) => del.mutateAsync(c.id)}
      renderForm={(close, editing) => <ContactForm close={close} editing={editing} />}
    />
  );
}

function ContactForm({ close, editing }: { close: () => void; editing: Contact | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ label: "", phone: "", category: "general", description: "", sort_order: 0 });
  useEffect(() => {
    if (editing) setForm({
      label: editing.label, phone: editing.phone, category: editing.category,
      description: editing.description ?? "", sort_order: editing.sort_order,
    });
  }, [editing]);
  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("emergency_contacts").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("emergency_contacts").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-emergency"] });
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
      <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="space-y-1"><Label>Category</Label>
        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="medical, security, organizer, emergency, general" />
      </div>
      <div className="space-y-1"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="space-y-1"><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
      <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending || !form.label || !form.phone}>
        {save.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
