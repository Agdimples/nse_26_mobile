import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Users,
  QrCode,
  Zap,
  Download,
} from "lucide-react";

export type Exhibitor = {
  id: string;
  company_name: string;
  logo_url?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  power_needs: string;
  signage_text?: string | null;
  booth_number?: string | null;
  is_approved?: boolean;
  claim_code?: string | null;
  owned_by?: string | null;
  created_at: string;
};

export type BoothAttendant = {
  id: string;
  exhibitor_id: string;
  full_name: string;
  badge_code: string;
  phone?: string | null;
  created_at: string;
};

export type Lead = {
  id: string;
  exhibitor_id: string;
  delegate_id?: string | null;
  captured_by?: string | null;
  notes?: string | null;
  created_at: string;
};

const POWER_LABELS: Record<string, string> = {
  standard: "Standard plug (13A)",
  heavy: "Heavy machinery power (30A+)",
  none: "No power required",
};

export function ExhibitorsPage() {
  const qc = useQueryClient();

  const { data: exhibitors = [] } = useQuery<Exhibitor[]>({
    queryKey: ["admin-exhibitors"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("exhibitors")
        .select("*")
        .order("company_name");
      if (error) {
        console.warn("Could not fetch exhibitors:", error);
        return [];
      }
      return data ?? [];
    },
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("leads").select("*");
      if (error) return [];
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<Exhibitor>) => {
      if (item.id) {
        const { id, ...rest } = item;
        const { error } = await (supabase as any)
          .from("exhibitors")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const claimCode = `EXH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const { error } = await (supabase as any)
          .from("exhibitors")
          .insert({ ...item, claim_code: claimCode });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved successfully");
      qc.invalidateQueries({ queryKey: ["admin-exhibitors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("exhibitors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exhibitor removed");
      qc.invalidateQueries({ queryKey: ["admin-exhibitors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function exportLeadsCsv() {
    if (leads.length === 0) return;
    const exhibitorMap = new Map<string, string>();
    exhibitors.forEach((ex) => exhibitorMap.set(ex.id, ex.company_name));

    const rows = leads.map((l) => [
      exhibitorMap.get(l.exhibitor_id) ?? "Unknown",
      l.captured_by ?? "",
      l.notes ? `"${l.notes.replace(/"/g, '""')}"` : "",
      new Date(l.created_at).toLocaleString(),
    ]);

    const header = ["Exhibitor", "Captured By", "Notes", "Captured At"];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nse-2026-exhibitor-leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${leads.length} leads`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Exhibitors & Booths</h2>
          <p className="text-sm text-muted-foreground">
            Registered corporate exhibitors, booth allocation, power needs, and attendant passes.
          </p>
        </div>
        <div className="flex gap-2">
          {leads.length > 0 && (
            <Button size="sm" variant="outline" onClick={exportLeadsCsv}>
              <Download className="mr-1 h-3.5 w-3.5" /> Export Leads ({leads.length})
            </Button>
          )}
          <AddExhibitorDialog
            onSave={(item) => saveMutation.mutate(item)}
            isSaving={saveMutation.isPending}
          />
        </div>
      </div>

      {exhibitors.length === 0 ? (
        <Card className="border border-dashed p-8 text-center text-sm text-muted-foreground shadow-none">
          <Building2 className="mx-auto mb-2 h-8 w-8 opacity-40 text-primary" />
          <p className="font-semibold text-foreground">No exhibitors registered yet</p>
          <p className="text-xs mt-1">Add corporate sponsors and exhibition booth participants.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {exhibitors.map((ex) => (
            <ExhibitorCard
              key={ex.id}
              ex={ex}
              leads={leads.filter((l) => l.exhibitor_id === ex.id)}
              onSave={(updated) => saveMutation.mutate({ ...updated, id: ex.id })}
              onDelete={() => {
                if (confirm(`Remove ${ex.company_name} and all attendant passes?`)) {
                  deleteMutation.mutate(ex.id);
                }
              }}
              isSaving={saveMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddExhibitorDialog({
  onSave,
  isSaving,
}: {
  onSave: (item: Partial<Exhibitor>) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    power_needs: "standard",
    booth_number: "",
    signage_text: "",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Exhibitor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Exhibitor</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="c-name">Company Name *</Label>
            <Input
              id="c-name"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="e.g. Julius Berger Nigeria Plc"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="c-contact">Contact Person</Label>
              <Input
                id="c-contact"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-phone">Phone</Label>
              <Input
                id="c-phone"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="0803 123 4567"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="contact@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="c-booth">Booth Number</Label>
              <Input
                id="c-booth"
                value={form.booth_number}
                onChange={(e) => setForm({ ...form, booth_number: e.target.value })}
                placeholder="Booth A12"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-power">Power Requirements</Label>
              <select
                id="c-power"
                value={form.power_needs}
                onChange={(e) => setForm({ ...form, power_needs: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="standard">Standard plug (13A)</option>
                <option value="heavy">Heavy machinery power</option>
                <option value="none">No power</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="c-signage">Fascia Signage Text (Exact Display)</Label>
            <Textarea
              id="c-signage"
              rows={2}
              value={form.signage_text}
              onChange={(e) => setForm({ ...form, signage_text: e.target.value })}
              placeholder="Exact text on booth header banner"
            />
          </div>

          <Button
            className="w-full mt-2"
            disabled={isSaving || !form.company_name.trim()}
            onClick={() => {
              onSave(form);
              setOpen(false);
              setForm({
                company_name: "",
                contact_name: "",
                contact_phone: "",
                contact_email: "",
                power_needs: "standard",
                booth_number: "",
                signage_text: "",
              });
            }}
          >
            Save Exhibitor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExhibitorCard({
  ex,
  leads,
  onSave,
  onDelete,
  isSaving,
}: {
  ex: Exhibitor;
  leads: Lead[];
  onSave: (item: Partial<Exhibitor>) => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [showPasses, setShowPasses] = useState(false);
  const [attendantName, setAttendantName] = useState("");
  const [attendantPhone, setAttendantPhone] = useState("");

  const { data: attendants = [] } = useQuery<BoothAttendant[]>({
    queryKey: ["booth-attendants", ex.id],
    enabled: showPasses,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("booth_attendants")
        .select("*")
        .eq("exhibitor_id", ex.id);
      if (error) return [];
      return data ?? [];
    },
  });

  const addAttendantMutation = useMutation({
    mutationFn: async () => {
      const badgeCode = `NSE-EXH-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await (supabase as any).from("booth_attendants").insert({
        exhibitor_id: ex.id,
        full_name: attendantName.trim(),
        badge_code: badgeCode,
        phone: attendantPhone.trim() || null,
      });
      if (error) throw error;
      return badgeCode;
    },
    onSuccess: (code) => {
      toast.success(`Attendant pass created: ${code}`);
      setAttendantName("");
      setAttendantPhone("");
      qc.invalidateQueries({ queryKey: ["booth-attendants", ex.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAttendantMutation = useMutation({
    mutationFn: async (attendantId: string) => {
      const { error } = await (supabase as any)
        .from("booth_attendants")
        .delete()
        .eq("id", attendantId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pass deleted");
      qc.invalidateQueries({ queryKey: ["booth-attendants", ex.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border-0 p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{ex.company_name}</p>
          <p className="text-xs text-muted-foreground">
            {[ex.contact_name, ex.contact_phone, ex.contact_email].filter(Boolean).join(" · ") ||
              "No contact specified"}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setEditOpen(true)}
            aria-label="Edit exhibitor"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            onClick={onDelete}
            aria-label="Delete exhibitor"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {ex.claim_code && !ex.owned_by && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-warning-soft px-2.5 py-1.5">
          <code className="text-xs font-bold tracking-widest">{ex.claim_code}</code>
          <span className="text-[11px] text-muted-foreground">
            Unclaimed company self-management code
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto h-6 w-6"
            onClick={async () => {
              await navigator.clipboard.writeText(ex.claim_code!);
              toast.success("Claim code copied");
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-xs">
          <Zap className="mr-1 h-3 w-3 text-warning-foreground" />
          {POWER_LABELS[ex.power_needs] ?? ex.power_needs}
        </Badge>
        {ex.booth_number && (
          <Badge variant="outline" className="text-xs font-semibold text-primary">
            Booth: {ex.booth_number}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          <Users className="mr-1 h-3 w-3" />
          {attendants.length} passes
        </Badge>
        {leads.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {leads.length} leads
          </Badge>
        )}
      </div>

      {ex.signage_text && (
        <p className="mt-2 rounded-md bg-muted/50 px-2.5 py-1 text-xs text-foreground">
          <span className="font-semibold text-muted-foreground">Signage:</span> {ex.signage_text}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPasses(!showPasses)}
          className="gap-1.5"
        >
          <QrCode className="h-3.5 w-3.5" />
          {showPasses ? "Hide Passes" : "Attendant Passes"}
        </Button>
      </div>

      {showPasses && (
        <div className="mt-3 rounded-lg border border-border p-3 space-y-3 bg-surface/50">
          <div className="flex gap-2">
            <Input
              value={attendantName}
              onChange={(e) => setAttendantName(e.target.value)}
              placeholder="Attendant full name"
              className="h-8 text-xs"
            />
            <Input
              value={attendantPhone}
              onChange={(e) => setAttendantPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="h-8 text-xs w-36"
            />
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={!attendantName.trim() || addAttendantMutation.isPending}
              onClick={() => addAttendantMutation.mutate()}
            >
              Add Pass
            </Button>
          </div>

          <div className="space-y-1.5">
            {attendants.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs"
              >
                <div>
                  <p className="font-medium">{att.full_name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{att.badge_code}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  onClick={() => deleteAttendantMutation.mutate(att.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {attendants.length === 0 && (
              <p className="text-center py-2 text-xs text-muted-foreground">No passes issued yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Exhibitor Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {ex.company_name}</DialogTitle>
          </DialogHeader>
          <EditExhibitorForm
            ex={ex}
            isSaving={isSaving}
            onSave={(updated) => {
              onSave(updated);
              setEditOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function EditExhibitorForm({
  ex,
  onSave,
  isSaving,
}: {
  ex: Exhibitor;
  onSave: (item: Partial<Exhibitor>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    company_name: ex.company_name,
    contact_name: ex.contact_name ?? "",
    contact_phone: ex.contact_phone ?? "",
    contact_email: ex.contact_email ?? "",
    power_needs: ex.power_needs,
    booth_number: ex.booth_number ?? "",
    signage_text: ex.signage_text ?? "",
  });

  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-1">
        <Label>Company Name</Label>
        <Input
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Contact Name</Label>
          <Input
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Contact Phone</Label>
          <Input
            value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Contact Email</Label>
        <Input
          type="email"
          value={form.contact_email}
          onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Booth Number</Label>
          <Input
            value={form.booth_number}
            onChange={(e) => setForm({ ...form, booth_number: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Power Requirements</Label>
          <select
            value={form.power_needs}
            onChange={(e) => setForm({ ...form, power_needs: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="standard">Standard plug (13A)</option>
            <option value="heavy">Heavy machinery power</option>
            <option value="none">No power</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Fascia Signage Text</Label>
        <Textarea
          rows={2}
          value={form.signage_text}
          onChange={(e) => setForm({ ...form, signage_text: e.target.value })}
        />
      </div>

      <Button
        className="w-full mt-2"
        disabled={isSaving || !form.company_name.trim()}
        onClick={() => onSave(form)}
      >
        Save Changes
      </Button>
    </div>
  );
}
