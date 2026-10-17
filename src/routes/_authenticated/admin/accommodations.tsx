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
import { Plus, Trash2, GripVertical } from "lucide-react";
import { HotelImageSlider } from "@/components/app/HotelImageSlider";
import type { Database } from "@/integrations/supabase/types";

type Hotel = Database["public"]["Tables"]["accommodations"]["Row"];

/** image_url stores images as newline-separated URLs (first = main). */
function parseImageUrls(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeImageUrls(urls: string[]): string {
  return urls.map((s) => s.trim()).filter(Boolean).join("\n");
}

export const Route = createFileRoute("/_authenticated/admin/accommodations")({
  beforeLoad: () => requireSubRole(["logistics"]),
  component: AdminHotels,
});

function AdminHotels() {
  const qc = useQueryClient();
  const { data: hotels = [] } = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: async () => {
      const { data } = await supabase.from("accommodations").select("*").order("name");
      return data ?? [];
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accommodations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-hotels"] });
    },
  });

  return (
    <AdminListShell<Hotel>
      title="Hotels"
      items={hotels}
      rowTitle={(h) => h.name}
      rowSubtitle={(h) => `${h.distance_km ?? "?"} km · ${"₦".repeat(h.price_tier)}`}
      onDelete={(h) => del.mutateAsync(h.id)}
      renderForm={(close, editing) => <HotelForm close={close} editing={editing} />}
    />
  );
}

function HotelForm({ close, editing }: { close: () => void; editing: Hotel | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    distance_km: 0,
    price_tier: 3,
    price_range: "",
    rating: 0,
    latitude: 0,
    longitude: 0,
    booking_url: "",
  });

  // Images managed as a separate string[] for UX, serialised into image_url on save
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description ?? "",
        address: editing.address ?? "",
        distance_km: Number(editing.distance_km ?? 0),
        price_tier: editing.price_tier,
        price_range: editing.price_range ?? "",
        rating: Number(editing.rating ?? 0),
        latitude: Number(editing.latitude ?? 0),
        longitude: Number(editing.longitude ?? 0),
        booking_url: editing.booking_url ?? "",
      });
      const parsed = parseImageUrls(editing.image_url);
      setImageUrls(parsed.length ? parsed : [""]);
    }
  }, [editing]);

  const validImages = imageUrls.filter((u) => u.trim().length > 0);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        image_url: serializeImageUrls(imageUrls),
      };
      if (editing) {
        const { error } = await supabase.from("accommodations").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accommodations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-hotels"] });
      qc.invalidateQueries({ queryKey: ["accommodations"] });
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function setUrl(index: number, value: string) {
    setImageUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  function addUrl() {
    setImageUrls((prev) => [...prev, ""]);
  }

  function removeUrl(index: number) {
    setImageUrls((prev) => prev.length === 1 ? [""] : prev.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setImageUrls((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Basic details ── */}
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>

      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="space-y-1">
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Distance (km)</Label>
          <Input type="number" step="0.1" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label>Price tier (1–5)</Label>
          <Input type="number" min={1} max={5} value={form.price_tier} onChange={(e) => setForm({ ...form, price_tier: Number(e.target.value) })} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Price range</Label>
        <Input value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Latitude</Label>
          <Input type="number" step="0.000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label>Longitude</Label>
          <Input type="number" step="0.000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Booking URL</Label>
        <Input value={form.booking_url} onChange={(e) => setForm({ ...form, booking_url: e.target.value })} />
      </div>

      {/* ── Image gallery manager ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            Photos
            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
              first = main image
            </span>
          </Label>
          <button
            type="button"
            onClick={addUrl}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add photo
          </button>
        </div>

        <div className="space-y-2">
          {imageUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* Reorder handle (tap to promote to top) */}
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                title={i === 0 ? "Main image" : "Move up"}
                className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
              >
                {i === 0 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    ★
                  </span>
                ) : (
                  <GripVertical className="h-4 w-4" />
                )}
              </button>

              <Input
                value={url}
                onChange={(e) => setUrl(i, e.target.value)}
                placeholder={i === 0 ? "Main image URL…" : `Sub-image ${i} URL…`}
                className="flex-1 text-xs"
              />

              <button
                type="button"
                onClick={() => removeUrl(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Live slider preview */}
        {validImages.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <HotelImageSlider
              images={validImages}
              shortName={form.name || "Preview"}
              alt="Preview"
              className="aspect-[16/9] sm:aspect-auto sm:h-48"
              autoPlayMs={0}
            />
            <p className="px-3 py-1.5 text-center text-[10px] text-muted-foreground">
              Preview · swipe or use dots to navigate
            </p>
          </div>
        )}
      </div>

      <Button
        className="w-full"
        onClick={() => save.mutate()}
        disabled={save.isPending || !form.name}
      >
        {save.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
