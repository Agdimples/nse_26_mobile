import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const has = (r: string) => roles?.some((x) => x.role === r);
    if (!has("admin") && !has("super_admin")) {
      throw redirect({ to: "/home" });
    }
  },
  component: AdminLayout,
});

type AdminTab = {
  to:
    | "/admin"
    | "/admin/exhibitors"
    | "/admin/sessions"
    | "/admin/speakers"
    | "/admin/accommodations"
    | "/admin/emergency"
    | "/admin/announcements"
    | "/admin/menu"
    | "/admin/orders"
    | "/admin/ushers"
    | "/admin/staff";
  label: string;
  exact?: boolean;
  // Sub-roles that may see this tab. super_admin always sees everything.
  roles: AppRole[];
};

const tabs: ReadonlyArray<AdminTab> = [
  { to: "/admin", label: "Overview", exact: true, roles: ["super_admin", "front_desk", "kitchen", "program", "logistics", "comms"] },
  { to: "/admin/exhibitors", label: "Exhibitors", roles: ["super_admin", "admin"] },
  { to: "/admin/sessions", label: "Sessions", roles: ["program"] },
  { to: "/admin/speakers", label: "Speakers", roles: ["program"] },
  { to: "/admin/accommodations", label: "Hotels", roles: ["logistics"] },
  { to: "/admin/menu", label: "Menu", roles: ["kitchen"] },
  { to: "/admin/orders", label: "Orders", roles: ["kitchen"] },
  { to: "/admin/ushers", label: "Ushers", roles: ["front_desk"] },
  { to: "/admin/emergency", label: "Emergency", roles: ["logistics"] },
  { to: "/admin/announcements", label: "Announcements", roles: ["comms"] },
  { to: "/admin/staff", label: "Staff & People", roles: ["super_admin", "admin"] },
];

const ROLE_LABEL: Record<AppRole, string> = {
  attendee: "Attendee",
  admin: "Admin",
  super_admin: "Super Admin",
  front_desk: "Front Desk",
  kitchen: "Kitchen",
  program: "Program",
  logistics: "Logistics",
  comms: "Comms",
};

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { roles, hasAnyAdminRole } = useAuth();
  const isSuper = roles.includes("super_admin");
  const visible = tabs.filter((t) => isSuper || hasAnyAdminRole(t.roles));

  // Human-friendly badge of which role panels you can access
  const myRoles = (Object.keys(ROLE_LABEL) as AppRole[]).filter(
    (r) => roles.includes(r) && r !== "attendee" && r !== "admin",
  );

  return (
    <div>
      <div className="bg-brand-gradient px-4 pb-4 pt-4 text-white">
        <h1 className="text-xl font-bold">Admin</h1>
        <p className="text-sm text-white/70">
          {myRoles.length > 0
            ? `Signed in as ${myRoles.map((r) => ROLE_LABEL[r]).join(" + ")}`
            : "Manage conference content"}
        </p>
      </div>
      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className="p-4">
        <Outlet />
      </div>
    </div>
  );
}
