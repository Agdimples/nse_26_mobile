import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/about")({
  component: AboutPage,
});

function AboutPage() {
  const info = CONFERENCE_INFO;
  const [feeTier, setFeeTier] = useState<"early" | "late">("early");

  return (
    <div className="space-y-4 pb-10">
      <NsePageHeader
        title="Maiduguri 2026"
        subtitle="Official conference guide, fees & schedule."
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

            <div className="mx-auto mt-4 max-w-xs rounded-xl bg-white/15 p-2.5 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Theme
              </p>
              <p className="mt-0.5 text-xs font-bold leading-snug text-white">
                “{info.theme}”
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
              <span className="flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 font-medium">
                <Calendar className="h-3 w-3 text-emerald-300" />
                {info.dates}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 font-medium">
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

        {/* Official Register Button Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white shadow-elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Registration Portal Open
              </p>
              <p className="text-sm font-extrabold">Paystack & Remita Enabled</p>
            </div>
            <a
              href={info.registrationPortal ?? "https://conference.nse.org.ng/registration"}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" className="bg-white font-bold text-emerald-800 hover:bg-emerald-50">
                Register Now
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>

        {/* Interactive Content Sections */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/70 p-1">
            <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs">Schedule</TabsTrigger>
            <TabsTrigger value="fees" className="text-xs">Fees</TabsTrigger>
            <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
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
                  Visit Portal <ExternalLink className="h-3 w-3" />
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
                {TRANSPORT.buses.length} active buses assigned across conference hotels and ICC.
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

          {/* Tab 3: Registration Fees & Guidelines */}
          <TabsContent value="fees" className="mt-4 space-y-4">
            {/* Early bird vs Late toggle */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={feeTier === "early" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeeTier("early")}
                className="text-xs"
              >
                Early Bird (Until 31 Aug)
              </Button>
              <Button
                variant={feeTier === "late" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeeTier("late")}
                className="text-xs"
              >
                Late Registration (From 1 Sept)
              </Button>
            </div>

            <div className="space-y-2.5">
              {(feeTier === "early"
                ? info.fees?.earlyBird.items
                : info.fees?.lateRegistration.items
              )?.map((f) => (
                <Card key={f.category} className="border-0 p-3.5 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">{f.category}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {f.benefits.map((b) => (
                          <span
                            key={b}
                            className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                      {f.amount}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Registration Instructions */}
            <Card className="border-0 p-4 shadow-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                How to Register
              </h4>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                {(info.guidelines?.individual ?? []).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <p className="leading-snug">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <a
                  href={info.registrationPortal ?? "https://conference.nse.org.ng/registration"}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-primary font-bold">
                    Open Registration Portal (Paystack & Remita)
                  </Button>
                </a>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 4: Official Enquiries & Contacts */}
          <TabsContent value="contact" className="mt-4 space-y-3">
            <Card className="border-0 p-4 shadow-card">
              <h4 className="text-sm font-bold text-foreground">Official Conference Contacts</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Nigerian Society of Engineers Conference Secretariat:
              </p>

              <div className="mt-3 space-y-3 divide-y divide-border text-xs">
                <div className="pt-2">
                  <p className="font-semibold text-foreground">Registration Enquiries</p>
                  <a
                    href="tel:+2342013301060"
                    className="mt-0.5 flex items-center gap-1.5 font-mono text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    +234 201 330 1060 (Ext. 4815, 4852, 4851, 4861)
                  </a>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-foreground">Technical Support</p>
                  <a
                    href="tel:+2342013301060"
                    className="mt-0.5 flex items-center gap-1.5 font-mono text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    +234 201 330 1060 (Ext. 4833)
                  </a>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-foreground">Partnership, Exhibition & Adverts</p>
                  <a
                    href="tel:+2342013301060"
                    className="mt-0.5 flex items-center gap-1.5 font-mono text-primary hover:underline"
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
                  <p className="font-semibold text-foreground">General Support Email</p>
                  <a
                    href="mailto:conference@nse.org.ng"
                    className="mt-0.5 flex items-center gap-1.5 text-primary hover:underline"
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
