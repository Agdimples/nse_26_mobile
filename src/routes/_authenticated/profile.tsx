import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState({
    display_name: "",
    company: "",
    title: "",
    bio: "",
    avatar_url: "",
    networking_opt_in: true,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        company: profile.company ?? "",
        title: profile.title ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
        networking_opt_in: profile.networking_opt_in,
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Your Profile"
        subtitle="How other attendees see you in the network"
        backTo="/more"
      />

      <div className="space-y-4 px-4 pt-4">
        <Card className="border-0 bg-surface rounded-2xl p-5 shadow-card">
          <div className="mb-5 flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
              <AvatarImage src={form.avatar_url || undefined} />
              <AvatarFallback className="text-lg font-bold bg-primary-soft text-primary">{initials(form.display_name || "?")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Avatar URL</Label>
              <Input
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                placeholder="https://…"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dn">Display name</Label>
              <Input id="dn" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Civil Engineer" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company / Branch</Label>
                <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. NSE Maiduguri Branch" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A line or two about your engineering discipline and focus." className="rounded-xl" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Show me in the attendee directory</p>
                <p className="text-xs text-muted-foreground">Other attendees can find and message you.</p>
              </div>
              <Switch
                checked={form.networking_opt_in}
                onCheckedChange={(v) => setForm({ ...form, networking_opt_in: v })}
              />
            </div>
          </div>

          <Button className="mt-5 w-full" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
