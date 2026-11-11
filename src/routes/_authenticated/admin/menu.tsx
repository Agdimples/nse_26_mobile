import { createFileRoute } from "@tanstack/react-router";
import { requireSubRole } from "@/lib/admin-guard";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminListShell } from "@/components/admin/AdminListShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/menu")({
  beforeLoad: () => requireSubRole(["kitchen"]),
  component: AdminMenu,
});

function AdminMenu() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data } = await supabase.from("menu_items").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-menu-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("menu_categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
      qc.invalidateQueries({ queryKey: ["menu-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <AdminListShell<MenuItem>
      title="Menu items"
      items={items}
      rowTitle={(i) => `${i.name} · ${formatNGN(i.price_ngn)}`}
      rowSubtitle={(i) => `${catName(i.category_id)}${i.is_available ? "" : " · unavailable"}`}
      onDelete={(i) => del.mutateAsync(i.id)}
      renderForm={(close, editing) => <ItemForm close={close} editing={editing} categories={categories} />}
    />
  );
}

function ItemForm({
  close, editing, categories,
}: {
  close: () => void;
  editing: MenuItem | null;
  categories: { id: string; name: string }[];
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", description: "", price_ngn: 0, image_url: "", category_id: categories[0]?.id ?? "", is_available: true, sort_order: 0,
  });
  useEffect(() => {
    if (editing) setForm({
      name: editing.name,
      description: editing.description ?? "",
      price_ngn: Number(editing.price_ngn),
      image_url: editing.image_url ?? "",
      category_id: editing.category_id ?? categories[0]?.id ?? "",
      is_available: editing.is_available,
      sort_order: editing.sort_order,
    });
  }, [editing, categories]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, category_id: form.category_id || null };
      if (editing) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="space-y-1"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Price (₦)</Label><Input type="number" value={form.price_ngn} onChange={(e) => setForm({ ...form, price_ngn: Number(e.target.value) })} /></div>
        <div className="space-y-1"><Label>Category</Label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
        <label className="flex items-end gap-2 text-sm"><input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} /> Available</label>
      </div>
      <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
        {save.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
