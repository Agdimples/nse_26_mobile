# My Conference Companion

Web app for **NSE International Conference 2026** — Maiduguri, Borno State.

## Run locally

```bash
npm install
npm run dev
```

Configure Supabase in the root `.env.local` using `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`). The URL must be
the project root (for example, `https://<project-ref>.supabase.co`), not an API
endpoint such as `/rest/v1` or `/auth/v1`. These are public client credentials;
never put a service-role key in a `VITE_` variable.

## AI concierge

The chatbot needs a Gemini API key on the server. Create one in
[Google AI Studio](https://aistudio.google.com/apikey), then add it to the root
`.env.local`:

```env
GEMINI_API_KEY=your-key
```

Keep this key server-side: do not prefix it with `VITE_`, commit it, or put it
in the Android client. Restart `npm run dev` after adding it. For production
and preview deployments, add `GEMINI_API_KEY` in the Vercel project's
**Settings → Environment Variables** for each environment you use, then
redeploy.

## Bot protection (Cloudflare Turnstile)

Sign-up and sign-in are gated by a Cloudflare Turnstile challenge. Turnstile
is a privacy-friendly reCAPTCHA alternative and is one of the CAPTCHA providers
Supabase Auth validates natively (hCaptcha is the other).

To turn it on:

1. Create a Turnstile widget at
   <https://dash.cloudflare.com/?to=/:account/turnstile> (add your app's hostname).
2. Copy the **Site Key** into `.env.local` as `VITE_TURNSTILE_SITE_KEY` (the site key is
   public and safe to ship to the browser).
3. In the Supabase dashboard, go to **Authentication → Bot and Abuse Protection**,
   enable CAPTCHA protection, choose **Turnstile**, and paste the **Secret Key**.

With the site key unset, the widget is hidden and no token is sent — so the app
keeps working while Supabase's CAPTCHA protection is disabled. Set both the site
key (here) and the secret key (Supabase) to enforce it. The secret key is never
stored in this repo.

## What's in the app

| Area          | Screens                                                              |
| ------------- | -------------------------------------------------------------------- |
| **Core**      | Auth, Home, Activity (waitlist), More                                |
| **Programme** | Schedule, Session detail, Speakers                                   |
| **Venue**     | Maiduguri, Map (ICC + outdoor), Directions, Nearby                   |
| **Hotels**    | 47 delegate hotels (bundled from the official masterlist) + Supabase |
| **Concierge** | Usher, Food, Errands, My orders                                      |
| **Social**    | Chat rooms, Delegate directory, DMs                                  |
| **Safety**    | Announcements, Emergency contacts                                    |
| **AI**        | On-device about conference                                           |
| **Admin**     | Role-gated dashboards and queues                                     |

## Reference data

Programme/branding/hotels source: `C:\Users\Sage Trill\Music\SAGE\ORIVON EDGE\PROJECTS\NSE`

Re-extract hotels after NSE Hotels updates:

```bash
node tool/extract_hotels.mjs
```

## Design

Official NSE palette (navy, green, gold, paper) + Plus Jakarta Sans. Shared components in `lib/core/widgets/nse_ui.dart`.
