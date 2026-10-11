import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Phone, Stethoscope, Lock, Megaphone, AlertTriangle, ShieldAlert } from "lucide-react";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/_authenticated/emergency")({
  component: EmergencyPage,
});

/* Bundled baseline — official NSE conference secretariat & emergency services */
const BASE_CONTACTS = [
  {
    id: "registration-hotline",
    name: "Registration & Secretariat Desk",
    detail: "ICC Main Lobby — Ext. 4815, 4852, 4851, 4861",
    phone: "+234 201 330 1060",
    icon: Megaphone,
    tint: "text-primary",
    bg: "bg-primary-soft",
  },
  {
    id: "technical-hotline",
    name: "Technical Support Desk",
    detail: "Presentation and IT issues — Ext. 4833",
    phone: "+234 201 330 1060",
    icon: ShieldAlert,
    tint: "text-primary",
    bg: "bg-primary-soft",
  },
  {
    id: "partnership-hotline",
    name: "Partnership & Exhibition Desk",
    detail: "Exhibitor & partnership enquiries — Ext. 4855",
    phone: "+234 201 330 1060",
    icon: Megaphone,
    tint: "text-success",
    bg: "bg-success-soft",
  },
  {
    id: "police",
    name: "Police (Borno Command)",
    detail: "National emergency line",
    phone: "112",
    icon: Lock,
    tint: "text-primary",
    bg: "bg-primary-soft",
  },
  {
    id: "ambulance",
    name: "Ambulance / Medical",
    detail: "Emergency medical response team at ICC",
    phone: "112",
    icon: Stethoscope,
    tint: "text-destructive",
    bg: "bg-destructive-soft",
  },
] as const;

function EmergencyPage() {
  const { data: dbContacts = [], isLoading } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("sort_order");
      return (data ?? []) as {
        id: string;
        label: string;
        phone: string;
        category?: string;
        description?: string;
      }[];
    },
  });

  const getIconProps = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "medical":
        return { icon: Stethoscope, tint: "text-destructive", bg: "bg-destructive-soft" };
      case "emergency":
      case "police":
        return { icon: Lock, tint: "text-primary", bg: "bg-primary-soft" };
      case "technical":
        return { icon: ShieldAlert, tint: "text-primary", bg: "bg-primary-soft" };
      case "partnership":
        return { icon: Megaphone, tint: "text-success", bg: "bg-success-soft" };
      default:
        return { icon: Megaphone, tint: "text-primary", bg: "bg-primary-soft" };
    }
  };

  // If database contacts are loaded, display them; otherwise fallback to bundled BASE_CONTACTS
  const contactsToDisplay = dbContacts.length > 0
    ? dbContacts.map((c) => ({
        id: c.id,
        name: c.label,
        detail: c.description || c.category || "Official Desk",
        phone: c.phone,
        ...getIconProps(c.category),
      }))
    : BASE_CONTACTS;

  return (
    <div className="pb-24">
      <NsePageHeader
        title="Emergency"
        subtitle="Tap a contact to call immediately."
        backTo="/home"
      />
      <div className="space-y-3 px-4 pt-4">
        {contactsToDisplay.map((c) => (
          <ContactCard key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}

function ContactCard({
  name,
  detail,
  phone,
  icon: Icon,
  tint,
  bg,
}: {
  id: string;
  name: string;
  detail: string;
  phone: string;
  icon: typeof Phone;
  tint: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${tint}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button size="sm" asChild className="shrink-0">
        <a href={`tel:${phone.replace(/\s+/g, "")}`} aria-label={`Call ${name}`}>
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
      </Button>
    </div>
  );
}
