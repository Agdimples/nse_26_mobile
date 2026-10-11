// Conference-wide configuration. Synced with official Maiduguri 2026 portal and flyer.
export const EVENT_CONFIG = {
  name: "NSE Conference",
  year: "2026",
  fullName: "2026 International Engineering Conference, Exhibition and Annual General Meeting",
  brandName: "Maiduguri 2026",
  // The app's display brand (header title, AI concierge subtitle).
  shortName: "Conference Companion",
  tagline: "Engineering Innovation for Enhanced Security and Sustainable National Development",
  dates: "Monday, 30th Nov. – Friday, 4th Dec., 2026",
  venue: {
    name: "The International Conference Centre",
    address: "Maiduguri, Borno State, Nigeria",
    latitude: 11.8333,
    longitude: 13.1500,
  },
  // Start/end of the conference (local time, year/month are 0-indexed in JS Date: Month 10 = Nov, Month 11 = Dec).
  start: new Date(2026, 10, 30),
  end: new Date(2026, 11, 4, 23, 59),
  wifi: { ssid: "NSE-Conference-2026", password: "engineers2026" },
  primaryHotline: "+234 201 330 1060 (Ext. 4815)",
  registrationHotlines: [
    "+234 201 330 1060 (Ext. 4815)",
    "+234 201 330 1060 (Ext. 4852)",
    "+234 201 330 1060 (Ext. 4851)",
    "+234 201 330 1060 (Ext. 4861)",
  ],
  technicalHotline: "+234 201 330 1060 (Ext. 4833)",
  partnershipContact: "+234 201 330 1060 (Ext. 4855)",
  partnershipEmail: "mimusa@nse.org.ng",
  email: "conference@nse.org.ng",
  portalUrl: "https://conference.nse.org.ng",
  registrationUrl: "https://conference.nse.org.ng/registration",
} as const;

