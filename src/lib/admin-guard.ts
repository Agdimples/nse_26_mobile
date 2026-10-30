import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * beforeLoad guard for admin sub-routes. Admin and super-admin see everything;
 * otherwise the user must hold at least one of the listed sub-roles.
 * Called as: beforeLoad: () => requireSubRole(["kitchen"])
 */
export async function requireSubRole(allowed: ReadonlyArray<string>) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw redirect({ to: "/auth" });
  const { data: rows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  const roles = (rows ?? []).map((r) => r.role as string);
  if (roles.includes("admin") || roles.includes("super_admin")) return;
  if (allowed.some((r) => roles.includes(r))) return;
  throw redirect({ to: "/admin" });
}
