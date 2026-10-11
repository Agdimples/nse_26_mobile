import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NsePageHeader } from "@/components/app/NsePageHeader";
import { CONFERENCE_INFO, TRANSPORT } from "@/lib/reference";
import { EVENT_CONFIG } from "@/lib/event-config";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  Clock,
  Shield,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/about")({
  component: AboutPage,
});

function AboutPage() {
  const info = CONFERENCE_INFO;

  return (
    <div className="space-y-4 pb-16">
      <NsePageHeader
        title="Maiduguri 2026"
        subtitle="Official conference guide, programme & secretariat"
        backTo="/home"
      />

      <div className="space-y-4 px-4">
        {/* Official Hero Banner */}
        <Card className="relative overflow-hidden border-0 shadow-elevated">
          <div className="hero-sheen bg-brand-gradient px-4 py-6 text-center text-white">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 p-2 shadow-inner backdrop-blur-md">
              <img
                src="/nse_crest.png"
                alt="NSE Crest"
                className="h-10 w-10 rounded-full bg-white p-0.5 object-contain"
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-white/80">
              {info.organizationName}
            </p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              MAIDUGURI 2026
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-white/90">
              {info.conferenceTitle}
            </p>

            <div className="mx-auto mt-4 max-w-xs rounded-xl bg-white/15 p-2.5 backdrop-blur-md border border-white/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Theme
              </p>
              <p className="mt-0.5 text-xs font-bold leading-snug text-white">
                “{info.theme}”
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
              <span className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1 font-medium">
                <Calendar className="h-3 w-3 text-emerald-300" />
                {info.dates}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1 font-medium">
                <MapPin className="h-3 w-3 text-emerald-300" />
                ICC, Maiduguri
              </span>
            </div>
          </div>
        </Card>

        {/* 4 Key Conference Impact Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {info.stats.map((s) => (
            <Card key={s.label} className="border-0 bg-surface p-2.5 shadow-card">
              <p className="text-base font-extrabold text-primary">{s.value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-tight text-muted-foreground">
                {s.label}
              </p>
            </Card>
          ))}
        </div>

        {/* Interactive Content Sections: Clean 3-tab layout without payment/registration talk */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/70 p-1">
            <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs">5-Day Outline</TabsTrigger>
            <TabsTrigger value="contact" className="text-xs">Secretariat</TabsTrigger>
          </TabsList>

          {/* Tab 1: About the Conference */}
          <TabsContent value="about" className="mt-4 space-y-4">
            <Card className="border-0 p-4 shadow-card">
              <h3 className="text-sm font-bold text-foreground">About the Conference</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                {info.aboutSummary}
              </p>

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Conference Chairman
                </p>
                <p className="text-sm font-bold text-foreground">{info.chairman}</p>
              </div>

              <div className="mt-3 flex gap-3 text-xs">
                <a
                  href={info.officialSite}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  Official Portal <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </Card>

            {/* Sub-committees */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-0 p-3.5 shadow-card">
                <p className="text-xs font-bold text-foreground">{info.entertainment.title}</p>
                <p className="text-[11px] text-primary">Chair: {info.entertainment.chair}</p>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {info.entertainment.focus}
                </p>
              </Card>

              <Card className="border-0 p-3.5 shadow-card">
                <p className="text-xs font-bold text-foreground">{info.spouses.title}</p>
                <p className="text-[11px] text-primary">{info.spouses.venue}</p>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {info.spouses.focus}
                </p>
              </Card>
            </div>

            {/* Delegate Shuttle summary */}
            <Card className="border-0 p-4 shadow-card">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary">
                  Delegate Transport
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {TRANSPORT.policyDescriptions[TRANSPORT.defaultPolicy]}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {TRANSPORT.buses.length} active shuttles running daily across official delegate hotels and the ICC.
              </p>
            </Card>

            {/* Society Stats */}
            <div className="flex flex-wrap gap-2">
              {(info.societyStats ?? []).map((s) => (
                <Badge
                  key={s.label}
                  variant="outline"
                  className="border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300"
                >
                  {s.value} {s.label}
                </Badge>
              ))}
            </div>
          </TabsContent>

          {/* Tab 2: 5-Day Schedule Outline */}
          <TabsContent value="schedule" className="mt-4 space-y-3">
            {(info.scheduleOutline ?? []).map((day) => (
              <Card key={day.day} className="overflow-hidden border-0 shadow-card">
                <div className="border-l-4 border-primary p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">
                      Day {day.day} · {day.date}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {day.time}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-foreground leading-snug">
                    {day.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {day.summary}
                  </p>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Tab 3: Official Secretariat & Help Desks */}
          <TabsContent value="contact" className="mt-4 space-y-3">
            <Card className="border-0 p-4 shadow-card">
              <h4 className="text-sm font-bold text-foreground">On-Site Secretariat & Desks</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Conference assistance desks located at the International Conference Centre (ICC):
              </p>

              <div className="mt-3 space-y-3 divide-y divide-border text-xs">
                <div className="pt-2">
                  <p className="font-semibold text-foreground">Secretariat & Kit Collection</p>
                  <p className="text-[11px] text-muted-foreground">ICC Main Foyer</p>
                  <a
                    href="tel:+2342013301060"
                    className="mt-1 flex items-center gap-1.5 font-mono text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    +234 201 330 1060 (Ext. 4815, 4852, 4851, 4861)
                  </a>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-foreground">Technical & Presentation Desk</p>
                  <p className="text-[11px] text-muted-foreground">Speaker preview room & AV support</p>
                  <a
                    href="tel:+2342013301060"
                    className="mt-1 flex items-center gap-1.5 font-mono text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    +234 201 330 1060 (Ext. 4833)
                  </a>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-foreground">Partnership, Exhibition & Protocol</p>
                  <a
                    href="tel:+2342013301060"
                    className="mt-1 flex items-center gap-1.5 font-mono text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    +234 201 330 1060 (Ext. 4855)
                  </a>
                  <a
                    href="mailto:mimusa@nse.org.ng"
                    className="mt-1 flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    mimusa@nse.org.ng
                  </a>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-foreground">General Secretariat Email</p>
                  <a
                    href="mailto:conference@nse.org.ng"
                    className="mt-1 flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    conference@nse.org.ng
                  </a>
                </div>
              </div>
            </Card>

            {/* Microsoft CMT Acknowledgement */}
            {info.acknowledgment && (
              <Card className="border-0 bg-muted/40 p-3.5 text-[11px] leading-relaxed text-muted-foreground shadow-sm">
                <span className="font-bold text-foreground">Acknowledgment: </span>
                {info.acknowledgment}
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          {EVENT_CONFIG.fullName} · {EVENT_CONFIG.dates}
        </p>
      </div>
    </div>
  );
}
