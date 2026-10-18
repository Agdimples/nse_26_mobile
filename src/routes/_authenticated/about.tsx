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
  Bus,
  Users,
  Award,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/about")({
  component: AboutPage,
});

function AboutPage() {
  const info = CONFERENCE_INFO;

  return (
    <div className="space-y-5 pb-28">
      <NsePageHeader
        title="Maiduguri 2026"
        subtitle="Conference · Programme · Secretariat"
        backTo="/home"
      />

      <div className="space-y-5 px-4">

        {/* ── Hero Banner ─────────────────────────────────────────── */}
        <Card className="relative overflow-hidden border-0 shadow-elevated">
          <div className="hero-sheen  px-5 py-8 text-center text-white">
            {/* Crest */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 shadow-lg ring-2 ring-white/30 backdrop-blur-md">
              <img
                src="/nse_crest.png"
                alt="NSE Crest"
                className="h-16 w-16 rounded-full bg-white p-1 object-contain"
              />
            </div>

            {/* Org name */}
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/75">
              {info.organizationName}
            </p>

            {/* Conference title */}
            <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              MAIDUGURI 2026
            </h1>
            <p className="mx-auto mt-1 max-w-xs text-sm font-medium text-white/90 leading-snug">
              {info.conferenceTitle}
            </p>

            {/* Theme pill */}
            <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-white/25 bg-white/15 px-4 py-3 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
                Conference Theme
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-white">
                &ldquo;{info.theme}&rdquo;
              </p>
            </div>

            {/* Date / venue chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-4 py-1.5 font-medium">
                <Calendar className="h-4 w-4 text-emerald-300" />
                {info.dates}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-4 py-1.5 font-medium">
                <MapPin className="h-4 w-4 text-emerald-300" />
                ICC, Maiduguri
              </span>
            </div>
          </div>
        </Card>

        {/* ── Impact Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2.5 text-center">
          {info.stats.map((s) => (
            <Card
              key={s.label}
              className="border-0 bg-surface p-3 shadow-card"
            >
              <p className="text-xl font-extrabold text-primary">{s.value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-tight text-muted-foreground leading-tight">
                {s.label}
              </p>
            </Card>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/70 p-1 h-11">
            <TabsTrigger value="about" className="text-sm font-semibold">About</TabsTrigger>
            <TabsTrigger value="schedule" className="text-sm font-semibold">Programme</TabsTrigger>
            <TabsTrigger value="contact" className="text-sm font-semibold">Secretariat</TabsTrigger>
          </TabsList>

          {/* ════════════════ TAB 1 · ABOUT ═══════════════════════ */}
          <TabsContent value="about" className="mt-4 space-y-4">

            {/* About NSE */}
            <Card className="border-0 p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground leading-tight">
                  About NSE
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The Nigerian Society of Engineers (NSE) — founded in 1958 — is the umbrella
                professional body for engineers in Nigeria. It advances the engineering profession
                through standard-setting, professional development and policy input on national
                infrastructure and technology, and it is the organiser of the annual International
                Engineering Conference, Exhibition and Annual General Meeting.
              </p>
              <a
                href={info.officialSite}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Official Portal <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Card>

            {/* About the Conference */}
            <Card className="border-0 p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground leading-tight">
                  About This Conference
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {info.aboutSummary}
              </p>
            </Card>

            {/* Leadership cards */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-0.5">
                Organising Committee
              </h4>

              {/* Chairman */}
              <Card className="border-0 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Conference Chairman</p>
                    <p className="mt-0.5 text-sm font-semibold text-primary">{info.chairman}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Leads the National Organizing Committee for the conference and all sub-committees.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Entertainment */}
              <Card className="border-0 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                    <Award className="h-5 w-5 text-warning-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{info.entertainment.title}</p>
                    <p className="mt-0.5 text-sm font-semibold text-primary">Chair: {info.entertainment.chair}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {info.entertainment.focus}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Spouses */}
              <Card className="border-0 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft">
                    <Users className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{info.spouses.title}</p>
                    <p className="mt-0.5 text-sm text-primary font-medium">{info.spouses.venue}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {info.spouses.focus}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Delegate Transport */}
            <Card className="border-0 p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
                  <Bus className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">Delegate Transport</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {TRANSPORT.policyDescriptions[TRANSPORT.defaultPolicy]}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{TRANSPORT.buses.length} active shuttles</span> running daily across official delegate hotels and the ICC.
              </p>
            </Card>

            {/* Society Stats */}
            {(info.societyStats ?? []).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-0.5">
                  NSE by the Numbers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(info.societyStats ?? []).map((s) => (
                    <Badge
                      key={s.label}
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      {s.value} {s.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ════════════════ TAB 2 · SCHEDULE ════════════════════ */}
          <TabsContent value="schedule" className="mt-4 space-y-3">
            {(info.scheduleOutline ?? []).map((day) => (
              <Card key={day.day} className="overflow-hidden border-0 shadow-card">
                <div className="flex">
                  {/* Day number sidebar */}
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center bg-primary/10 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Day</p>
                    <p className="text-2xl font-extrabold text-primary">{day.day}</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 border-l-4 border-primary p-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                        {day.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {day.time}
                      </span>
                    </div>
                    <h4 className="mt-2.5 text-base font-bold text-foreground leading-snug">
                      {day.title}
                    </h4>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {day.summary}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* ════════════════ TAB 3 · SECRETARIAT ═════════════════ */}
          <TabsContent value="contact" className="mt-4 space-y-4">

            <Card className="border-0 overflow-hidden shadow-card">
              {/* Header */}
              <div className="bg-primary/10 px-5 py-4 border-b border-border">
                <h4 className="text-base font-bold text-foreground">On-Site Secretariat &amp; Desks</h4>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Located at the International Conference Centre (ICC)
                </p>
              </div>

              {/* Desk items */}
              <div className="divide-y divide-border">

                {/* Secretariat */}
                <div className="flex items-start gap-3 p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft mt-0.5">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Secretariat &amp; Kit Collection</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">ICC Main Foyer</p>
                    <a
                      href="tel:+2342013301060"
                      className="mt-2 flex items-center gap-1.5 text-sm font-mono font-medium text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      +234 201 330 1060 (Ext. 4815, 4852, 4851, 4861)
                    </a>
                  </div>
                </div>

                {/* Technical */}
                <div className="flex items-start gap-3 p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft mt-0.5">
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Technical &amp; Presentation Desk</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">Speaker preview room &amp; AV support</p>
                    <a
                      href="tel:+2342013301060"
                      className="mt-2 flex items-center gap-1.5 text-sm font-mono font-medium text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      +234 201 330 1060 (Ext. 4833)
                    </a>
                  </div>
                </div>

                {/* Partnership */}
                <div className="flex items-start gap-3 p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft mt-0.5">
                    <Users className="h-5 w-5 text-warning-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Partnership, Exhibition &amp; Protocol</p>
                    <a
                      href="tel:+2342013301060"
                      className="mt-2 flex items-center gap-1.5 text-sm font-mono font-medium text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      +234 201 330 1060 (Ext. 4855)
                    </a>
                    <a
                      href="mailto:mimusa@nse.org.ng"
                      className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      mimusa@nse.org.ng
                    </a>
                  </div>
                </div>

                {/* General email */}
                <div className="flex items-start gap-3 p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-soft mt-0.5">
                    <Mail className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">General Secretariat Email</p>
                    <a
                      href="mailto:conference@nse.org.ng"
                      className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      conference@nse.org.ng
                    </a>
                  </div>
                </div>

              </div>
            </Card>

            {/* Acknowledgment */}
            {info.acknowledgment && (
              <Card className="border-0 bg-muted/40 p-4 shadow-sm">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Acknowledgment: </span>
                  {info.acknowledgment}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <p className="pt-2 text-center text-sm text-muted-foreground">
          {EVENT_CONFIG.fullName} · {EVENT_CONFIG.dates}
        </p>

      </div>
    </div>
  );
}
