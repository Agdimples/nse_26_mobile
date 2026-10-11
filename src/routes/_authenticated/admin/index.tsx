import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, type AppRole } from "@/lib/auth";
import { formatRelative } from "@/lib/format";
import { EVENT_CONFIG } from "@/lib/event-config";
import {
  Calendar,
  Mic,
  Hotel,
  Phone,
  Megaphone,
  Users,
  UtensilsCrossed,
  ConciergeBell,
  ShoppingBag,
  ArrowRight,
  Radio,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

/* ------------------------------ shared data ------------------------------ */

type AdminCounts = {
  sessions: number;
  speakers: number;
  accommodations: number;
  emergency: number;
  announcements: number;
  attendees: number;
  menu: number;
  openOrders: number;
  openUshers: number;
};

function useAdminCounts(enabled = true) {
  return useQuery({
    queryKey: ["admin-counts"],
    enabled,
    queryFn: async (): Promise<AdminCounts> => {
      const [s, sp, a, e, an, p, m, o, u] = await Promise.all([
        supabase.from("sessions").select("id", { count: "exact", head: true }),
        supabase.from("speakers").select("id", { count: "exact", head: true }),
        supabase.from("accommodations").select("id", { count: "exact", head: true }),
        supabase.from("emergency_contacts").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("menu_items").select("id", { count: "exact", head: true }),
        supabase.from("food_orders").select("id", { count: "exact", head: true }).in("status", ["pending", "preparing", "ready"]),
        supabase.from("usher_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "acknowledged"]),
      ]);
      return {
        sessions: s.count ?? 0,
        speakers: sp.count ?? 0,
        accommodations: a.count ?? 0,
        emergency: e.count ?? 0,
        announcements: an.count ?? 0,
        attendees: p.count ?? 0,
        menu: m.count ?? 0,
        openOrders: o.count ?? 0,
        openUshers: u.count ?? 0,
      };
    },
  });
}

/* ------------------------------ role plumbing ---------------------------- */

type SubRole = "front_desk" | "kitchen" | "program" | "logistics" | "comms";

const SUB_ROLE_ORDER: SubRole[] = ["front_desk", "kitchen", "program", "logistics", "comms"];

const ROLE_TITLE: Record<SubRole, string> = {
  front_desk: "Front Desk Control Center",
  kitchen: "Kitchen Control Center",
  program: "Program Control Center",
  logistics: "Logistics Control Center",
  comms: "Comms Control Center",
};

const ROLE_BLURB: Record<SubRole, string> = {
  front_desk: "Live usher beckons and delegate on-the-spot requests.",
  kitchen: "Food orders in flight and the served menu.",
  program: "Sessions, speakers, and the running order.",
  logistics: "Hotels, transport touchpoints, and emergency readiness.",
  comms: "Announcements broadcast to every attendee.",
};

function subRolesOf(roles: AppRole[]): SubRole[] {
  return SUB_ROLE_ORDER.filter((r) => roles.includes(r));
}

/* ------------------------------ route component -------------------------- */

function AdminOverview() {
  const { roles } = useAuth();
  const isSuper = roles.includes("super_admin");
  const mySubRoles = subRolesOf(roles);
  const [active, setActive] = useState<SubRole>(mySubRoles[0] ?? "front_desk");

  // Only staff with an actual sub-role get a single ControlCenter; super
  // admins and plain admins get the full command overview.
  if (mySubRoles.length === 0) {
    return <SuperOverview isSuper={isSuper} />;
  }

  return (
    <div className="space-y-4">
      {mySubRoles.length > 1 && (
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mySubRoles.map((r) => (
            <button
              key={r}
              onClick={() => setActive(r)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active === r ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {ROLE_TITLE[r].replace(" Control Center", "")}
            </button>
          ))}
        </div>
      )}
      <ControlCenter key={active} role={active} />
    </div>
  );
}

/* --------------------------- super admin overview ------------------------ */

type AdminStats = {
  attendees: number;
  networkingOptIn: number;
  signupsByDay: { date: string; count: number }[];
  sessionsByDay: { day: number; count: number }[];
  ordersByStatus: { pending: number; preparing: number; ready: number; delivered: number };
  ushersByStatus: { pending: number; acknowledged: number; resolved: number };
  announcements: number;
  sessions: number;
  speakers: number;
  hotels: number;
};

function useAdminStats() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      const [
        profilesRes, sessionsRes, ordPending, ordPreparing, ordReady, ordDelivered,
        ushPending, ushAck, ushResolved, annRes, spkRes, hotRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id, created_at, networking_opt_in").limit(2000),
        supabase.from("sessions").select("id, day"),
        supabase.from("food_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("food_orders").select("id", { count: "exact", head: true }).eq("status", "preparing"),
        supabase.from("food_orders").select("id", { count: "exact", head: true }).eq("status", "ready"),
        supabase.from("food_orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
        supabase.from("usher_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("usher_requests").select("id", { count: "exact", head: true }).eq("status", "acknowledged"),
        supabase.from("usher_requests").select("id", { count: "exact", head: true }).eq("status", "resolved"),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("speakers").select("id", { count: "exact", head: true }),
        supabase.from("accommodations").select("id", { count: "exact", head: true }),
      ]);

      const profiles = (profilesRes.data ?? []) as { id: string; created_at: string; networking_opt_in: boolean }[];
      const sessions = (sessionsRes.data ?? []) as { id: string; day: number }[];

      // Signups over the last 14 days (inclusive of today).
      const signupsByDay: { date: string; count: number }[] = [];
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const count = profiles.filter((p) => (p.created_at || "").slice(0, 10) === key).length;
        signupsByDay.push({ date: key, count });
      }

      const sessionsByDay = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
        day,
        count: sessions.filter((s) => s.day === day).length,
      }));

      return {
        attendees: profiles.length,
        networkingOptIn: profiles.filter((p) => p.networking_opt_in).length,
        signupsByDay,
        sessionsByDay,
        ordersByStatus: {
          pending: ordPending.count ?? 0,
          preparing: ordPreparing.count ?? 0,
          ready: ordReady.count ?? 0,
          delivered: ordDelivered.count ?? 0,
        },
        ushersByStatus: {
          pending: ushPending.count ?? 0,
          acknowledged: ushAck.count ?? 0,
          resolved: ushResolved.count ?? 0,
        },
        announcements: annRes.count ?? 0,
        sessions: sessions.length,
        speakers: spkRes.count ?? 0,
        hotels: hotRes.count ?? 0,
      };
    },
    refetchInterval: 60_000,
  });

  // Live updates: any change to ops tables refreshes the dashboard.
  useEffect(() => {
    const ch = supabase
      .channel("admin-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_orders" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-stats"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "usher_requests" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-stats"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-stats"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return query;
}

function daysToGo(): number {
  const start = EVENT_CONFIG.start;
  const now = new Date();
  return Math.max(
    0,
    Math.ceil(
      (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000,
    ),
  );
}

function SuperOverview({ isSuper }: { isSuper: boolean }) {
  const { data: s } = useAdminStats();
  const { user } = useAuth();

  const firstName = (user?.user_metadata?.full_name ?? "Command").split(" ").slice(0, 2).join(" ");
  const openOrders = s ? s.ordersByStatus.pending + s.ordersByStatus.preparing + s.ordersByStatus.ready : 0;
  const openUshers = s ? s.ushersByStatus.pending + s.ushersByStatus.acknowledged : 0;
  const maxSignups = Math.max(1, ...(s?.signupsByDay ?? []).map((d) => d.count));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-brand-gradient p-4 text-white shadow-elevated">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Command Centre
        </p>
        <h2 className="mt-0.5 text-lg font-bold">Good day, {firstName}</h2>
        <p className="mt-0.5 text-xs text-white/70">
          {EVENT_CONFIG.name} {EVENT_CONFIG.year} · {daysToGo()} days to go · ICC Maiduguri
        </p>
      </div>

      {/* Live ops strip */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/ushers">
          <Card className="border-0 p-4 shadow-card transition active:scale-[0.98]">
            <div className="flex items-center gap-1.5">
              <ConciergeBell className="h-4 w-4 text-warning-foreground" />
              {openUshers > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />}
            </div>
            <p className="mt-2 text-2xl font-bold">{openUshers}</p>
            <p className="text-xs text-muted-foreground">Usher queue open</p>
          </Card>
        </Link>
        <Link to="/admin/orders">
          <Card className="border-0 p-4 shadow-card transition active:scale-[0.98]">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-warning-foreground" />
              {openOrders > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />}
            </div>
            <p className="mt-2 text-2xl font-bold">{openOrders}</p>
            <p className="text-xs text-muted-foreground">Orders in flight</p>
          </Card>
        </Link>
        <Card className="border-0 p-4 shadow-card">
          <Users className="h-4 w-4 text-primary" />
          <p className="mt-2 text-2xl font-bold">{s?.attendees ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Registered attendees</p>
        </Card>
        <Link to="/admin/announcements">
          <Card className="border-0 p-4 shadow-card transition active:scale-[0.98]">
            <Megaphone className="h-4 w-4 text-primary" />
            <p className="mt-2 text-2xl font-bold">{s?.announcements ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Announcements sent</p>
          </Card>
        </Link>
      </div>

      {/* Signups — last 14 days */}
      <Card className="border-0 p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Registrations</p>
          <p className="text-xs text-muted-foreground">last 14 days</p>
        </div>
        <div className="mt-3 flex h-24 items-end gap-1">
          {(s?.signupsByDay ?? []).map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-sm ${d.count > 0 ? "bg-primary" : "bg-muted"}`}
                style={{ height: `${Math.max(4, (d.count / maxSignups) * 76)}px` }}
                title={`${d.date}: ${d.count}`}
              />
              <span className="text-[9px] text-muted-foreground">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {s?.networkingOptIn ?? 0} of {s?.attendees ?? 0} attendees opted into networking
        </p>
      </Card>


      {/* Kitchen funnel */}
      <Card className="border-0 p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Kitchen pipeline</p>
          <Link to="/admin/orders" className="flex items-center gap-0.5 text-xs font-medium text-primary">
            Order board <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {([
            ["Pending", s?.ordersByStatus.pending],
            ["Prepping", s?.ordersByStatus.preparing],
            ["Ready", s?.ordersByStatus.ready],
            ["Served", s?.ordersByStatus.delivered],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-xl bg-muted/60 p-2.5 text-center">
              <p className="text-lg font-bold">{value ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {isSuper && (
        <p className="text-xs text-muted-foreground">
          Super Admin: every section is yours. Each staff role also gets a focused
          control center with just their live queues.
        </p>
      )}
    </div>
  );
}

/* ------------------------------ control center --------------------------- */

function ControlCenter({ role }: { role: SubRole }) {
  const { data: counts } = useAdminCounts();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-brand-gradient p-4 text-white shadow-elevated">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          <Radio className="h-3.5 w-3.5" /> Live
        </p>
        <h2 className="mt-1 text-lg font-bold">{ROLE_TITLE[role]}</h2>
        <p className="mt-0.5 text-xs text-white/70">{ROLE_BLURB[role]}</p>
      </div>

      {role === "front_desk" && <FrontDeskCenter counts={counts} />}
      {role === "kitchen" && <KitchenCenter counts={counts} />}
      {role === "program" && <ProgramCenter counts={counts} />}
      {role === "logistics" && <LogisticsCenter counts={counts} />}
      {role === "comms" && <CommsCenter counts={counts} />}
    </div>
  );
}

function KpiRow({ items }: { items: { label: string; value: number | "—"; to?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ label, value, to }) => {
        const body = (
          <Card className="border-0 p-4 shadow-card">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        );
        return to ? (
          <Link key={label} to={to as "/admin"}>{body}</Link>
        ) : (
          <div key={label}>{body}</div>
        );
      })}
    </div>
  );
}

function QueueHeader({ title, count, href, linkLabel }: { title: string; count: number; href: string; linkLabel: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title} ({count})
      </h3>
      <Link to={href as "/admin"} className="flex items-center gap-0.5 text-xs font-medium text-primary">
        {linkLabel} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ------------------------------- front desk ------------------------------ */

function FrontDeskCenter({ counts }: { counts?: AdminCounts }) {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({
    queryKey: ["cc-ushers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("usher_requests")
        .select("*")
        .in("status", ["pending", "acknowledged"])
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("cc-ushers")
      .on("postgres_changes", { event: "*", schema: "public", table: "usher_requests" },
        () => qc.invalidateQueries({ queryKey: ["cc-ushers"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: { status: string; acknowledged_at?: string; resolved_at?: string } = { status };
      if (status === "acknowledged") patch.acknowledged_at = new Date().toISOString();
      if (status === "resolved") patch.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("usher_requests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cc-ushers"] }),
  });

  return (
    <>
      <KpiRow
        items={[
          { label: "Usher queue open", value: counts?.openUshers ?? "—", to: "/admin/ushers" },
          { label: "Registered attendees", value: counts?.attendees ?? "—" },
        ]}
      />
      <div>
        <QueueHeader title="Newest beckons" count={requests.length} href="/admin/ushers" linkLabel="Full queue" />
        {requests.length === 0 ? (
          <Card className="border border-dashed p-3 text-center text-xs text-muted-foreground shadow-none">
            Queue is clear — no delegate is waiting.
          </Card>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <Card key={r.id} className="border-0 p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold capitalize">{r.reason.replace("_", " ")}</p>
                    {r.location_label && <p className="text-xs text-muted-foreground">📍 {r.location_label}</p>}
                    <p className="text-[11px] text-muted-foreground">{formatRelative(r.created_at)}</p>
                  </div>
                  <Badge className={r.status === "pending" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}>
                    {r.status}
                  </Badge>
                </div>
                <div className="mt-2 flex gap-2">
                  {r.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => update.mutate({ id: r.id, status: "acknowledged" })}>
                      Acknowledge
                    </Button>
                  )}
                  <Button size="sm" onClick={() => update.mutate({ id: r.id, status: "resolved" })}>
                    Resolve
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* --------------------------------- kitchen ------------------------------- */

const ORDER_NEXT: Record<string, { label: string; status: string } | null> = {
  pending: { label: "Start preparing", status: "preparing" },
  preparing: { label: "Mark ready", status: "ready" },
  ready: { label: "Mark delivered", status: "delivered" },
};

function KitchenCenter({ counts }: { counts?: AdminCounts }) {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["cc-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("food_orders")
        .select("*, food_order_items(*), profiles:user_id(display_name)")
        .in("status", ["pending", "preparing", "ready"])
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("cc-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_orders" },
        () => qc.invalidateQueries({ queryKey: ["cc-orders"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("food_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cc-orders"] }),
  });

  return (
    <>
      <KpiRow
        items={[
          { label: "Orders in flight", value: counts?.openOrders ?? "—", to: "/admin/orders" },
          { label: "Menu items live", value: counts?.menu ?? "—", to: "/admin/menu" },
        ]}
      />
      <div>
        <QueueHeader title="Newest orders" count={orders.length} href="/admin/orders" linkLabel="Full board" />
        {orders.length === 0 ? (
          <Card className="border border-dashed p-3 text-center text-xs text-muted-foreground shadow-none">
            No open orders — the pass is clear.
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => {
              const next = ORDER_NEXT[o.status];
              return (
                <Card key={o.id} className="border-0 p-3 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {(o as { profiles?: { display_name?: string } }).profiles?.display_name ?? "Attendee"} ·{" "}
                        {o.food_order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0} items
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.food_order_items?.map((i) => `${i.quantity}× ${i.item_name_snapshot}`).join(", ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatRelative(o.created_at)}</p>
                    </div>
                    <Badge>{o.status}</Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {next && (
                      <Button size="sm" onClick={() => update.mutate({ id: o.id, status: next.status })}>
                        {next.label}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* --------------------------------- program ------------------------------- */

function ProgramCenter({ counts }: { counts?: AdminCounts }) {
  const { data: upcoming = [] } = useQuery({
    queryKey: ["cc-upcoming"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sessions")
        .select("id, title, day, room, starts_at")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <>
      <KpiRow
        items={[
          { label: "Sessions scheduled", value: counts?.sessions ?? "—", to: "/admin/sessions" },
          { label: "Speakers listed", value: counts?.speakers ?? "—", to: "/admin/speakers" },
        ]}
      />
      <div>
        <QueueHeader title="Next up" count={upcoming.length} href="/admin/sessions" linkLabel="Manage sessions" />
        {upcoming.length === 0 ? (
          <Card className="border border-dashed p-3 text-center text-xs text-muted-foreground shadow-none">
            Nothing ahead of now — add sessions to fill the programme.
          </Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map((s) => (
              <Card key={s.id} className="flex items-center gap-3 border-0 p-3 shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Day {s.day}{s.room ? ` · ${s.room}` : ""} · {formatRelative(s.starts_at)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* -------------------------------- logistics ------------------------------ */

function LogisticsCenter({ counts }: { counts?: AdminCounts }) {
  return (
    <>
      <KpiRow
        items={[
          { label: "Partner hotels", value: counts?.accommodations ?? "—", to: "/admin/accommodations" },
          { label: "Emergency contacts", value: counts?.emergency ?? "—", to: "/admin/emergency" },
        ]}
      />
      <Card className="border-0 p-4 shadow-card">
        <p className="text-sm font-semibold">Readiness checklist</p>
        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <li>• Keep hotel capacity and rates current before delegate arrivals (Nov 28).</li>
          <li>• Verify every emergency contact dials through from a Nigerian mobile.</li>
          <li>• Confirm shuttle pickup points match the announcements team's updates.</li>
        </ul>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/accommodations">
          <Card className="border-0 p-4 shadow-card transition active:scale-[0.98]">
            <Hotel className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold">Manage hotels</p>
          </Card>
        </Link>
        <Link to="/admin/emergency">
          <Card className="border-0 p-4 shadow-card transition active:scale-[0.98]">
            <Phone className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold">Manage emergency</p>
          </Card>
        </Link>
      </div>
    </>
  );
}

/* ---------------------------------- comms -------------------------------- */

function CommsCenter({ counts }: { counts?: AdminCounts }) {
  const { data: latest = [] } = useQuery({
    queryKey: ["cc-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <>
      <KpiRow
        items={[
          { label: "Announcements sent", value: counts?.announcements ?? "—", to: "/admin/announcements" },
          { label: "Attendees reached", value: counts?.attendees ?? "—" },
        ]}
      />
      <div className="grid grid-cols-1">
        <Link to="/admin/announcements">
          <Card className="border-0 p-4 shadow-card transition active:scale-[0.98]">
            <Megaphone className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold">Broadcast a new announcement</p>
            <p className="text-xs text-muted-foreground">Reaches every signed-in attendee instantly.</p>
          </Card>
        </Link>
      </div>
      <div>
        <QueueHeader title="Latest sent" count={latest.length} href="/admin/announcements" linkLabel="Manage all" />
        {latest.length === 0 ? (
          <Card className="border border-dashed p-3 text-center text-xs text-muted-foreground shadow-none">
            Nothing sent yet — the welcome broadcast is a good start.
          </Card>
        ) : (
          <div className="space-y-2">
            {latest.map((a) => (
              <Card key={a.id} className="flex items-center gap-3 border-0 p-3 shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(a.created_at)}</p>
                </div>
                {a.priority === "high" && <Badge variant="destructive">high</Badge>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
