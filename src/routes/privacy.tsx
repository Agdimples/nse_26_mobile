// Public privacy policy for My Conference Companion.
//
// This page is the URL entered in Google Play Console → App content → Privacy
// policy, so it must stay publicly reachable at /privacy with no sign-in.
//
// !! REVIEW BEFORE PUBLISHING !!
// This text was written from what the code actually stores and which processors
// it actually calls. It is NOT legal advice. Before you publish it, confirm with
// whoever owns data protection at Orivon Edge / NSE:
//   1. the legal entity named as the controller in section 1, and its registered
//      address (currently just "Orivon Edge Ltd" with no address);
//   2. the retention period in section 6 - the 12 months below is a placeholder
//      convention, not a decision anyone has made;
//   3. the deletion route in section 7 (email is acceptable to Google Play, but
//      you are promising a 30-day turnaround there).
// If those change, change them here - do not leave a claim on this page that the
// secretariat cannot honour.
//
// Keep in sync with the Data safety answers in PLAY_STORE_LAUNCH.md.
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${EVENT_CONFIG.shortName}` },
      {
        name: "description",
        content: `How ${EVENT_CONFIG.shortName} collects, uses and protects your personal information.`,
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

const LAST_UPDATED = "14 October 2026";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4">
      <h2 className="mt-8 text-base font-bold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="bg-brand-gradient px-5 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 p-1.5">
            <img
              src="/nse_crest.png"
              alt="NSE crest"
              className="h-11 w-11 rounded-full bg-white p-1 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold leading-tight">Privacy Policy</h1>
          <p className="mt-1 text-sm text-white/75">
            {EVENT_CONFIG.shortName} — {EVENT_CONFIG.name} {EVENT_CONFIG.year}
          </p>
          <p className="mt-3 text-xs text-white/60">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 text-sm">
        <p className="mt-6 leading-relaxed text-muted-foreground">
          This policy explains what personal information {EVENT_CONFIG.shortName} collects, why we
          collect it, who we share it with, and what you can ask us to do with it. It applies to the{" "}
          {EVENT_CONFIG.shortName} mobile app and the website at{" "}
          <span className="whitespace-nowrap">myconferencecompanion.com.ng</span>.
        </p>

        <Section id="who-we-are" title="1. Who is responsible for your information">
          <p>
            {EVENT_CONFIG.shortName} is the official delegate app for the {EVENT_CONFIG.fullName},
            held at {EVENT_CONFIG.venue.name}, {EVENT_CONFIG.venue.address}, from{" "}
            {EVENT_CONFIG.dates}. It is operated by <strong>Orivon Edge Ltd</strong> for the
            Nigerian Society of Engineers (NSE), which runs the conference.
          </p>
          <p>
            For the purposes of the Nigeria Data Protection Act 2023, Orivon Edge Ltd is the data
            controller for the information described here. Questions, requests and complaints go to{" "}
            <a className="font-medium text-primary underline" href={`mailto:${EVENT_CONFIG.email}`}>
              {EVENT_CONFIG.email}
            </a>
            .
          </p>
        </Section>

        <Section id="what-we-collect" title="2. What we collect">
          <p>
            <strong>Information you give us when you register.</strong> Your full name, email
            address and a password. Your password is stored in hashed form by our authentication
            provider; nobody at the conference secretariat can read it. If you were given a staff
            role code, that code is recorded against your account to determine which parts of the
            app you can see.
          </p>
          <p>
            <strong>Your delegate profile.</strong> Display name, job title, company or NSE branch,
            a short biography, and an optional avatar image. You can edit or clear these at any time
            in the app. You also choose whether you appear in the attendee directory.
          </p>
          <p>
            <strong>What you do in the app.</strong> Messages you post in conference chat rooms and
            in direct messages to other delegates; questions you ask the AI concierge; food orders,
            usher requests and errand requests you place; sessions you save to your agenda; and
            which announcements you have read.
          </p>
          <p>
            <strong>Location, only when you ask for directions.</strong> If you tap the GPS button
            on the Directions screen, your browser or device asks your permission and shares your
            approximate or precise coordinates so we can calculate how to get you to the venue. That
            is passed to Google Maps to compute the route. We do not store your location on our
            servers and we do not track you in the background.
          </p>
          <p>
            <strong>Technical information.</strong> Our hosting, database and bot-protection
            providers automatically record standard information such as your IP address, browser
            and device type, and the times you access the service. This is used to keep the service
            running reliably and to protect it from abuse.
          </p>
          <p>
            We do not use advertising trackers, we do not build advertising profiles, and we do not
            sell your information.
          </p>
        </Section>

        <Section id="why" title="3. Why we use it">
          <p>
            To create and secure your account; to show you the programme, speakers, venue, hotels
            and transport information; to let delegates find and message each other if they have
            chosen to be discoverable; to route food, usher and errand requests to conference staff;
            to answer your questions through the AI concierge; to send you conference announcements;
            to investigate problems, keep the service secure, and meet our legal obligations.
          </p>
        </Section>

        <Section id="sharing" title="4. Who we share it with">
          <p>
            We do not sell your information. We share it only with the service providers that run
            the app, and only as far as they need it:
          </p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              <strong>Supabase</strong> — the database and authentication service that stores your
              account and app content.
            </li>
            <li>
              <strong>Vercel</strong> — hosts the website and servers the app runs on.
            </li>
            <li>
              <strong>Cloudflare</strong> — provides the Turnstile check that stops automated abuse
              of the sign-in and sign-up forms, and protects the domain.
            </li>
            <li>
              <strong>Google Maps Platform</strong> — draws the maps and calculates directions. When
              you request directions, the coordinates involved are sent to Google.
            </li>
            <li>
              <strong>Google (Gemini), through the Lovable AI gateway</strong> — if the AI concierge
              is switched on, the questions you type to it are sent to this provider so it can
              generate an answer.
            </li>
            <li>
              <strong>Other delegates</strong> — only the profile fields you have chosen to publish
              in the attendee directory. Your email address is never shown to other delegates.
            </li>
            <li>
              <strong>NSE conference staff</strong> — authorised staff can view delegate records to
              coordinate the conference, process requests and handle support issues.
            </li>
          </ul>
          <p>
            Some of these providers process information outside Nigeria, including in the United
            States and the European Union. Where that happens we rely on the providers' contractual
            data-protection commitments.
          </p>
        </Section>

        <Section id="retention" title="5. How long we keep it">
          <p>
            We keep your account and app content for the duration of {EVENT_CONFIG.name}{" "}
            {EVENT_CONFIG.year} and for up to 12 months afterwards, so we can handle follow-up
            queries and produce conference records. After that it is deleted or anonymised. We keep
            records longer only where the law requires it, such as financial records for orders.
          </p>
        </Section>

        <Section id="your-rights" title="6. Your choices and rights">
          <p>
            You can edit or clear almost all of your profile information directly in the app, and
            turn off your visibility in the attendee directory at any time. You can also ask us to:
          </p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>tell you what personal information we hold about you, and give you a copy;</li>
            <li>correct anything that is wrong;</li>
            <li>delete your account and the content that belongs to it;</li>
            <li>restrict or object to particular uses of your information;</li>
            <li>withdraw consent you previously gave.</li>
          </ul>
          <p>
            To make any of these requests, email{" "}
            <a className="font-medium text-primary underline" href={`mailto:${EVENT_CONFIG.email}`}>
              {EVENT_CONFIG.email}
            </a>{" "}
            from the address you registered with. We will respond within 30 days. If you are not
            satisfied with our response, you can complain to the Nigeria Data Protection Commission.
          </p>
        </Section>

        <Section id="security" title="7. How we protect it">
          <p>
            Information travels between your device and our servers over encrypted HTTPS
            connections. Access to the database is controlled by row-level security rules, so a
            delegate can only read and change their own records and the conference content they are
            meant to see. Administrative access is restricted to authorised secretariat staff.
          </p>
        </Section>

        <Section id="children" title="8. Children">
          <p>
            {EVENT_CONFIG.shortName} is intended for conference delegates aged 18 and over. It is
            not directed at children, and we do not knowingly collect information from anyone under
            18.
          </p>
        </Section>

        <Section id="changes" title="9. Changes to this policy">
          <p>
            If we change how the app handles personal information, we will update this page and
            change the date at the top. Significant changes will also be announced in the app.
          </p>
        </Section>

        <Section id="contact" title="10. Contact us">
          <p>
            Orivon Edge Ltd, for the Nigerian Society of Engineers — {EVENT_CONFIG.name}{" "}
            {EVENT_CONFIG.year}.
          </p>
          <p>
            Email:{" "}
            <a className="font-medium text-primary underline" href={`mailto:${EVENT_CONFIG.email}`}>
              {EVENT_CONFIG.email}
            </a>
            <br />
            Registration desk: {EVENT_CONFIG.primaryHotline}
          </p>
        </Section>

        <p className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
          <Link to="/" className="font-medium text-primary underline">
            ← Back to {EVENT_CONFIG.shortName}
          </Link>
        </p>
      </main>
    </div>
  );
}
