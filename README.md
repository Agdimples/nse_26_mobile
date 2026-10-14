# My Conference Companion

Flutter app (iOS + Android) for **NSE International Conference 2026** — Maiduguri, Borno State.

## Run locally

```bash
flutter pub get
flutter run
```

Supabase credentials: root `.env` (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).

## Bot protection (Cloudflare Turnstile)

Sign-up and sign-in are gated by a Cloudflare Turnstile challenge. Turnstile
is a privacy-friendly reCAPTCHA alternative and is one of the CAPTCHA providers
Supabase Auth validates natively (hCaptcha is the other).

To turn it on:

1. Create a Turnstile widget at
   <https://dash.cloudflare.com/?to=/:account/turnstile> (add your app's hostname).
2. Copy the **Site Key** into `.env` as `VITE_TURNSTILE_SITE_KEY` (the site key is
   public and safe to ship to the browser).
3. In the Supabase dashboard, go to **Authentication → Bot and Abuse Protection**,
   enable CAPTCHA protection, choose **Turnstile**, and paste the **Secret Key**.

With the site key unset, the widget is hidden and no token is sent — so the app
keeps working while Supabase's CAPTCHA protection is disabled. Set both the site
key (here) and the secret key (Supabase) to enforce it. The secret key is never
stored in this repo.

## What's in the app

| Area | Screens |
|------|---------|
| **Core** | Auth, Home, Activity (waitlist), More |
| **Programme** | Schedule, Session detail, Speakers |
| **Venue** | Maidguide, Map (ICC + outdoor), Directions, Nearby |
| **Hotels** | 47 delegate hotels (bundled from the official masterlist) + Supabase |
| **Concierge** | Usher, Food, Errands, My orders |
| **Social** | Chat rooms, Delegate directory, DMs |
| **Safety** | Announcements, Emergency contacts |
| **AI** | On-device conference guide |
| **Admin** | Role-gated dashboards and queues |

## Reference data

Programme/branding/hotels source: `C:\Users\Sage Trill\Music\SAGE\ORIVON EDGE\PROJECTS\NSE`

Re-extract hotels after NSE Hotels updates:

```bash
node tool/extract_hotels.mjs
```

## Design

Official NSE palette (navy, green, gold, paper) + Plus Jakarta Sans. Shared components in `lib/core/widgets/nse_ui.dart`.
