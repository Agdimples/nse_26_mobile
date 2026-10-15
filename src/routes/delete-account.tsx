// Public "delete my account" page — the URL entered in Google Play Console →
// Data safety → "Add a link that users can use to request that their account
// and associated data is deleted". Must stay publicly reachable at
// /delete-account with no sign-in. Keep its wording in sync with /privacy
// (section 6 "Your choices and rights" and section 5 "How long we keep it").
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EVENT_CONFIG } from "@/lib/event-config";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: `Delete your account — ${EVENT_CONFIG.shortName}` },
      {
        name: "description",
        content: `How to request deletion of your ${EVENT_CONFIG.shortName} account and the personal data associated with it.`,
      },
    ],
  }),
  component: DeleteAccountPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Delete your account and your data</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {EVENT_CONFIG.shortName} — {EVENT_CONFIG.name} {EVENT_CONFIG.year}. Last updated: 14 October
          2026.
        </p>

        <Section title="How to request account deletion">
          <ol className="ml-4 list-decimal space-y-1.5">
            <li>
              Email{" "}
              <a className="font-medium text-primary underline" href={`mailto:${EVENT_CONFIG.email}`}>
                {EVENT_CONFIG.email}
              </a>{" "}
              from the email address registered on your {EVENT_CONFIG.shortName} account.
            </li>
            <li>
              Use the subject line{" "}
              <span className="font-medium text-foreground">
                &ldquo;Delete my account — {EVENT_CONFIG.shortName}&rdquo;
              </span>{" "}
              and tell us you want your account and its data deleted.
            </li>
            <li>
              For verification and faster handling, you may optionally include your profile name.
              Never send us your password.
            </li>
            <li>
              We confirm and complete the deletion within <strong>30 days</strong>. You will receive a
              confirmation email when it is done.
            </li>
          </ol>
          <p>
            You can also make this request in person at the conference registration desk ({" "}
            {EVENT_CONFIG.primaryHotline}) or through any authorised conference secretariat staff
            member.
          </p>
        </Section>

        <Section title="What gets deleted">
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Your sign-in account (email address and authentication record).</li>
            <li>Your profile information, such as your name, job title, company and phone number.</li>
            <li>Your directory visibility settings and any personal preferences you saved.</li>
          </ul>
        </Section>

        <Section title="What we keep, and for how long">
          <p>
            We keep your account and app content for the duration of {EVENT_CONFIG.name}{" "}
            {EVENT_CONFIG.year} and for up to 12 months afterwards for follow-up queries and
            conference records. When you request deletion we act on your request at that point rather
            than waiting out that period.
          </p>
          <p>
            We retain records longer only where the law requires it, such as financial records for
            completed orders. De-identified or aggregated records that cannot be linked back to you
            may be kept after deletion.
          </p>
        </Section>

        <Section title="Deleting data without deleting your account">
          <p>
            You can also ask us to delete some or all of your data while keeping your account. Email{" "}
            <a className="font-medium text-primary underline" href={`mailto:${EVENT_CONFIG.email}`}>
              {EVENT_CONFIG.email}
            </a>{" "}
            with the details of what you want removed, and we will handle it within the same 30-day
            response window. See our full{" "}
            <Link to="/privacy" className="font-medium text-primary underline">
              Privacy Policy
            </Link>{" "}
            for every data type we hold and why.
          </p>
        </Section>

        <p className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
          <Link to="/" className="font-medium text-primary underline">
            Back to {EVENT_CONFIG.shortName}
          </Link>
        </p>
      </div>
    </div>
  );
}
