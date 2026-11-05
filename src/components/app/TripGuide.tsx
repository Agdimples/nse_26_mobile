import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  Bus,
  CalendarDays,
  Hotel as HotelIcon,
  Mail,
  MapPin,
  Phone,
  Plane,
  ShieldCheck,
  Stethoscope,
  Store,
  Utensils,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { CONFERENCE_INFO, HOTELS, VENUE_DATA } from "@/lib/reference";

const WHY_MAIDUGURI = [
  "State capital and commercial hub",
  "Home of hospitality, serene and peaceful",
  "World-class conference facility",
  "State Government supported event",
  "Standard hotels at friendly rates",
  "Daily flights into Maiduguri",
  "Electric vehicle taxis",
  "Excellent road network and location services",
  "Rich culture, cuisine and craft",
];

const STAKEHOLDERS = [
  "Borno State Government and agencies",
  "Nigeria Police Force",
  "Department of State Services",
  "Emergency response agencies and fire services",
  "Traditional institutions",
  "NSCDC and paramilitary agencies",
  "Chamber of Commerce and Industries",
];

const STAND_OPTIONS = [
  {
    title: "Partner and sponsor spaces",
    text: "Frontline spaces are provided to partners for custom stands.",
  },
  {
    title: "Framed stand",
    text: "Can be constructed on site using materials sourced from the local market.",
  },
  {
    title: "Shell scheme",
    text: "A typical shell scheme is planned if logistics allow, as it will come from Abuja or Kano.",
  },
];

const ESSENTIAL_PLACES = ["Hospital", "Pharmacy", "Security"];

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-0 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {icon}
        </div>
        <h2 className="text-base font-bold leading-tight text-foreground">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function telHref(phone: string) {
  return `tel:${phone.split(",")[0].replace(/[^+\d]/g, "")}`;
}

export default function TripGuide() {
  const venue = VENUE_DATA;
  const enquiries = CONFERENCE_INFO.enquiries as
    { partnership?: string; partnershipEmail?: string; email?: string } | undefined;

  const hotels = HOTELS.filter((hotel) => hotel.qualityTier !== "pending" && hotel.distanceToVenue)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4);

  const places = venue.nearby
    .filter((poi) => ESSENTIAL_PLACES.includes(poi.category) && poi.distance)
    .sort((a, b) => parseFloat(a.distance ?? "99") - parseFloat(b.distance ?? "99"))
    .slice(0, 5);

  const eateries = venue.nearby
    .filter((poi) => poi.category === "Restaurant" && poi.phone)
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border-0 bg-brand-gradient p-5 text-white shadow-elevated">
        <div className="hero-sheen pointer-events-none absolute inset-0" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
            Trip guide
          </p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight">
            Maiduguri is ready to host the rest of Nigeria
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Everything you need to plan your visit to the NSE 2026 Exhibition at the International
            Conference Centre.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-300" />
              30 Nov – 4 Dec 2026
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-300" />
              ICC, Maiduguri
            </span>
          </div>
        </div>
      </Card>

      <SectionCard icon={<CalendarDays className="h-5 w-5" />} title="Exhibition opening">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The exhibition is officially opened at the end of the Opening Ceremony on{" "}
          <span className="font-semibold text-foreground">Tuesday, 1 December at 12:40pm</span>,
          followed by a tour of the exhibition and lunch. Registration runs from 8:00am on 30
          November and 1 December.
        </p>
      </SectionCard>

      <SectionCard icon={<Plane className="h-5 w-5" />} title="Getting there">
        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            Daily flights serve Maiduguri. The airport is about{" "}
            {venue.nearby.find((poi) => poi.category === "Airport")?.distance ?? "7.6 km"} from the
            city.
          </li>
          {venue.directions.slice(0, 2).map((direction) => (
            <li key={direction}>{direction}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={<Building2 className="h-5 w-5" />} title="The venue">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The brand-new International Conference Centre sits along the Maiduguri Airport road, in
          the centre of town and the hub of commercial activity. It combines an indoor conference
          facility, an exhibition pavilion, an outdoor display area and a marketplace.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{venue.parking}</p>
      </SectionCard>

      <SectionCard icon={<Bus className="h-5 w-5" />} title="Getting around">
        <p className="text-sm leading-relaxed text-muted-foreground">{venue.shuttle}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Electric vehicle taxis are also available in the city.{" "}
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{" "}
          for shuttle routes and marshal contacts.
        </p>
      </SectionCard>

      <SectionCard icon={<HotelIcon className="h-5 w-5" />} title="Where to stay">
        <ul className="space-y-3">
          {hotels.map((hotel) => (
            <li key={hotel.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{hotel.shortName}</p>
                <p className="text-xs text-muted-foreground">
                  {hotel.distanceToVenue?.replace(/km/i, "km")} from the ICC
                </p>
              </div>
              {hotel.contactPhone && (
                <a
                  href={telHref(hotel.contactPhone)}
                  className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {hotel.contactPhone.split(",")[0]}
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Standard hotels at friendly rates. Rates and the full list are on the Accommodation page
          after sign-in.
        </p>
      </SectionCard>

      {eateries.length > 0 && (
        <SectionCard icon={<Utensils className="h-5 w-5" />} title="Eat and shop">
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            Visitors can also use the Food Court and Market Square at the exhibition. In town, local
            favourites include:
          </p>
          <ul className="space-y-2">
            {eateries.map((poi) => (
              <li key={poi.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground">{poi.name}</span>
                {poi.phone && (
                  <a href={telHref(poi.phone)} className="text-xs font-semibold text-primary">
                    {poi.phone}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard icon={<Stethoscope className="h-5 w-5" />} title="Health and safety essentials">
        <ul className="space-y-2">
          {places.map((poi) => (
            <li key={poi.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{poi.name}</p>
                <p className="text-xs text-muted-foreground">{poi.category}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {poi.distance?.includes("km") ? poi.distance : `${poi.distance} km`}
              </span>
            </li>
          ))}
        </ul>
        <a
          href="tel:112"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-destructive-soft py-2.5 text-sm font-bold text-destructive"
        >
          <Phone className="h-4 w-4" /> Emergency line: 112
        </a>
      </SectionCard>

      <SectionCard icon={<ShieldCheck className="h-5 w-5" />} title="A safe, hitch-free conference">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Planning Committee works closely with key stakeholders to keep the conference safe and
          well run:
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-muted-foreground">
          {STAKEHOLDERS.map((name) => (
            <li key={name} className="flex gap-2">
              <span className="text-primary">•</span>
              {name}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={<Store className="h-5 w-5" />} title="Why Maiduguri">
        <ul className="grid grid-cols-1 gap-1.5 text-sm text-muted-foreground">
          {WHY_MAIDUGURI.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-primary">•</span>
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={<Store className="h-5 w-5" />} title="For exhibitors">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The exhibition is a platform for partnerships, professional networking and new business
          relationships. It spotlights Borno&rsquo;s resilient SMEs and MSMEs, the agro-allied,
          extractives and industrial sectors, and the organisations delivering solutions in
          resettlement, healthcare, water purification, environmental renewal and housing.
        </p>
        <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Stand options
        </h3>
        <ul className="space-y-2.5">
          {STAND_OPTIONS.map((option) => (
            <li key={option.title} className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{option.title}: </span>
              {option.text}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Booth sizes and rates are listed under each pavilion on the Floor Plan tab.
        </p>
      </SectionCard>

      <SectionCard icon={<Mail className="h-5 w-5" />} title="Exhibition and partnership enquiries">
        <ul className="space-y-2 text-sm">
          {enquiries?.partnership && (
            <li className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" />
              {enquiries.partnership}
            </li>
          )}
          {enquiries?.partnershipEmail && (
            <li>
              <a
                href={`mailto:${enquiries.partnershipEmail}`}
                className="flex items-center gap-2 font-semibold text-primary"
              >
                <Mail className="h-4 w-4" />
                {enquiries.partnershipEmail}
              </a>
            </li>
          )}
          {enquiries?.email && (
            <li>
              <a
                href={`mailto:${enquiries.email}`}
                className="flex items-center gap-2 font-semibold text-primary"
              >
                <Mail className="h-4 w-4" />
                {enquiries.email}
              </a>
            </li>
          )}
        </ul>
      </SectionCard>
    </div>
  );
}
