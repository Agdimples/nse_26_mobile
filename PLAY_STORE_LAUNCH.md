# Google Play launch — My Conference Companion

End-to-end runbook for getting My Conference Companion onto Google Play from the
account **Orivon Edge** (Personal, Account ID `4699401455850770341`), which
currently has no apps.

Everything in "What is already built" below is done and verified. Everything in
"Your steps" needs the Play Console, which only you can drive.

---

## Read this first: the calendar is the real risk

Two Google gates sit between you and a public listing, and both are measured in
weeks, not hours:

| Gate | Time |
|---|---|
| Closed test — **12 testers, opted in continuously for 14 days** (personal accounts) | 14 days, minimum |
| Production access review, then the release review itself | up to ~7 days each |

**Today is 14 October 2026. The conference starts 30 November 2026.**

Best case, starting today and with no rejections:

```
14 Oct  closed test starts with 12 opted-in testers
28 Oct  14 continuous days done -> apply for production access
~4 Nov  production access granted
~11 Nov  production release approved and live
```

That leaves ~19 days of slack before delegates arrive. Every week of delay eats
into it. **The single highest-value action right now is Step 6.** Do not wait
until the store listing is perfect — start the 14-day clock, then polish.

Halve the risk by recruiting **15–20 testers**, not exactly 12: a tester who opts
out resets their own continuous period, and you must still satisfy the threshold
at the moment you apply.

---

## Two 2026 deadlines that already apply to you

1. **Android developer verification.** Every Google Play package name has to be
   registered to a verified developer; Google's Play deadline was
   **30 September 2026**, and unregistered apps are removed from Play under the
   Play Console Requirements policy. Play auto-registers most apps, but a brand
   new one is exactly the case that needs you to look. You already have an
   **Android developer verification** item in your Console sidebar — open it.
   <https://support.google.com/googleplay/android-developer/answer/16984799>
2. **Target API level 36.** New apps and updates submitted from **31 August 2026**
   must target Android 16 / API 36. The bundle in this repo already does.
   <https://support.google.com/googleplay/android-developer/answer/11926878>

---

## What is already built

### The Android app

My Conference Companion is a web app, so the Android package is a **Trusted Web
Activity** (TWA): Chrome renders `https://www.myconferencecompanion.com.ng`
full-screen with no browser UI. Nothing is bundled, so **a website deploy is
instantly live in the app** — you will not ship an app update every time the
programme changes.

| | |
|---|---|
| Artifact | `android/app/build/outputs/bundle/release/app-release.aab` |
| Size / SHA-256 | 3,910,243 bytes / `5230aa9551cbc3e99965b0e024695216b4afd9e51998fb82163c3e5694338bce` |
| Application ID | `com.orivonedge.conferencecompanion` |
| Launcher name | `My Conference Companion` |
| Version | 1.0.0 (versionCode 1) |
| minSdk / targetSdk | 23 / **36** |
| Signed with | upload key `android/keystore/nse-upload.keystore` |

Verified from the built bundle: the manifest declares
`LauncherActivity` → `https://www.myconferencecompanion.com.ng/` with the
`DelegationService` and `FileProvider` a TWA needs, `targetSdkVersion="36"`,
`minSdkVersion="23"`, and the whole AAB is jar-signed (`META-INF/UPLOAD.RSA`).

> **The application ID is permanent once you upload.** If you want
> `ng.com.…`, or anything else, change it *before* the first upload — see
> [android/README.md](android/README.md).

### Signing

```bash
# created already; back these two files up, they are git-ignored and NOT on GitHub
android/keystore/nse-upload.keystore
android/keystore.properties
```

Upload-key SHA-256:
`5C:DF:17:CE:14:63:BE:6A:FB:DF:71:B4:DC:63:73:73:5C:B5:CB:D7:C1:E6:B0:75:6E:70:2D:FA:A9:FF:FD:D3`

Recreate with `powershell -ExecutionPolicy Bypass -File android/new-upload-key.ps1`.

### The web layer the TWA needs

| File | Purpose |
|---|---|
| [public/manifest.json](public/manifest.json) | name, icons, `display: standalone` — what Chrome requires |
| [public/sw.js](public/sw.js) | service worker: installability + offline fallback |
| [public/offline.html](public/offline.html) | branded page instead of Chrome's error screen |
| [public/.well-known/assetlinks.json](public/.well-known/assetlinks.json) | proves app and site share an owner |
| [public/icons/](public/icons) | 192 / 512 / maskable icons |
| [store/](store) | Play listing icon (512²) and feature graphic (1024×500) |
| [assets/nse-crest-512.png](assets/nse-crest-512.png) | the **official NSE crest** all artwork is generated from |
| [tool/gen_brand_artwork.ps1](tool/gen_brand_artwork.ps1) | regenerates all icons and the feature graphic from that crest |

Verified on a production build: the manifest returns `application/json`, the
service worker registers, activates and precaches six assets, and every declared
icon resolves.

Every icon — the web manifest icons, the Play listing icon and the Android
launcher icons (legacy **and** adaptive) — is the official NSE crest on NSE navy.
Nothing is hand-designed. The crest is taken from
<https://nse.org.ng/wp-content/uploads/2024/11/icon-1.png> (512×512, transparent
background); `gen_brand_artwork.ps1` strips a stray fragment near its bottom-left
corner and re-centres the emblem. Confirmed by decoding
`mipmap-*/ic_launcher.png` back out of the signed bundle.

### Still missing — and it will block review

- ~~**A privacy policy page.**~~ Written — [src/routes/privacy.tsx](src/routes/privacy.tsx),
  published at `/privacy`, linked from the sign-in screen and the in-app **More**
  menu. It is written from what the code actually stores and which processors it
  actually calls. **Read the `!! REVIEW BEFORE PUBLISHING !!` note at the top of
  that file** — it names the three claims only you can confirm (legal entity,
  12-month retention, 30-day deletion turnaround). It becomes a real URL only
  once the site is deployed.
- **Supabase CAPTCHA is switched off.** An auth call with no captcha token
  returns the ordinary `invalid_credentials`, so the Turnstile widget currently
  protects nothing. Turn it on: Supabase → *Authentication → Bot and Abuse
  Protection* → CAPTCHA → Turnstile → paste the secret key.

---

## Your steps

### Step 1 — Android developer verification

Play Console → **Android developer verification**. Confirm your identity is
verified and that the package `com.orivonedge.conferencecompanion` gets
registered (this happens when you upload). Certification from your earlier
identity check carries over — you only need the package registration.

Also: personal accounts must verify access to a **real Android device** through
the Play Console mobile app before the app can go live.
<https://support.google.com/googleplay/android-developer/answer/10841920>

### Step 2 — Create the app

**Home → Create app**

| Field | Value |
|---|---|
| App name | `My Conference Companion` |
| Default language | English (en-US) |
| App or game | App |
| Free or paid | Free |
| Contact email | your developer email |
| Declarations | tick the Developer Program Policies, US export, and Play App Signing ToS |

Accept **Play App Signing** (Google generates and holds the app signing key —
that is the default and the right choice here).

### Step 3 — App content (the forms that actually cause rejections)

**Policy and programs → App content.** Answer these for *this* app:

| Declaration | Answer |
|---|---|
| **Privacy policy** | the URL from the blocker above — **required** |
| **App access** | **"All functionality is available without special access" is FALSE.** The app is login-gated. Provide reviewer credentials — see below. |
| **Ads** | No |
| **Content rating** | complete the questionnaire (unrated apps are removed) |
| **Target audience** | Adults, 18+. Do **not** select children — the app has chat/DMs, which triggers extra Families policy duties. |
| **News / magazines** | No |
| **Government apps** | No (unless NSE requires an affiliation declaration) |
| **Financial features** | No — but you must still complete the form; since Oct 2025 it is required for every app even with no financial features. |
| **Health** | No — again, complete the form to declare "no health features". |

#### App access — do not get this wrong

A reviewer who cannot log in will reject the app. In **App access**, add working
instructions:

1. Create a dedicated reviewer account (e.g. `play-review@…`) and give it a
   normal delegate role.
2. Enter the email + password in Play Console.
3. Note in the instructions that sign-in also passes a Cloudflare Turnstile
   challenge, and that the reviewer should simply complete the checkbox.

The account must survive until review finishes — don't delete it.

### Step 4 — Store listing

Ready to upload from `store/`:

- `store/play-icon-512.png` — 512×512 app icon
- `store/play-feature-graphic-1024x500.png` — feature graphic

**Screenshots you must capture yourself** (these must be the real app): at least
2, ideally 4+, portrait 1080×1920. Suggested set: Home, Schedule, Venue map,
Networking. Google requires four 1080p+ screenshots for eligibility in some
recommendation surfaces.

Text to write (Play limits in brackets):

- **Short description (80)** — e.g. `Your NSE 2026 conference companion: schedule, venue map, hotels and networking.`
- **Full description (4000)** — programme, Maiduguri venue info, hotels,
  directions, networking, and that sign-in is by delegate/role code.

### Step 5 — Internal testing (optional, minutes)

Upload the AAB to **Internal testing** first. This is the fastest way to catch a
broken bundle before spending your 14 days. Add your own Google account as a
tester and install it from the opt-in link.

Watch for: the app opening **with a Chrome URL bar** — that is failed Digital
Asset Links and is expected until Step 9.

### Step 6 — Closed testing: START THIS NOW

**Testing → Closed testing → Create track**, upload the same AAB, and share the
opt-in link with **at least 12 people** (aim for 15–20). Requirements for the
production-access threshold:

- each tester must be **opted in continuously for 14 days**
- the threshold must still be met when you apply
- an opt-out resets that tester's clock

Ask your testers to actually use it — Google explicitly weighs tester engagement
and asks for the feedback you collected when you apply.
<https://support.google.com/googleplay/android-developer/answer/14151465>

### Step 7 — Apply for production access

When the 14 days are done: **Dashboard → Apply for production**. You will be
asked about tester recruitment and engagement, what your testers used, the
feedback you gathered, the app's intended audience and value, and your estimated
first-year install count. Review usually takes ≤7 days but can take longer.

### Step 8 — Production release

Create the production release with the same AAB, complete the store listing and
roll out. Expect up to ~7 days for review, longer for a new developer account.

### Step 9 — After the first upload: finish Digital Asset Links

This is the step everyone misses. Until it is done, the Play-installed app works
but shows a **URL bar across the top** — proof that verification failed.

1. Play Console → **Test and release → App integrity → App signing key
   certificate** → copy the **SHA-256**.
2. Add it to the `sha256_cert_fingerprints` array in
   [public/.well-known/assetlinks.json](public/.well-known/assetlinks.json)
   (keep the upload-key fingerprint too — that one covers `adb install`-ed builds).
3. Redeploy the site.

Confirm it is live:

```bash
curl -s https://www.myconferencecompanion.com.ng/.well-known/assetlinks.json
# expect HTTP 200, Content-Type: application/json
```

---

## Data safety answers for this app

Be accurate — this section is a policy violation if wrong. What the app actually
stores, from `supabase/migrations`:

| Data | Where it comes from | Data safety answer |
|---|---|---|
| Email address | Supabase Auth | Collected · App functionality, Account management · not shared |
| Name (`display_name`) | `profiles` | Collected · App functionality · visible to other opted-in delegates |
| Company, job title, bio, interests | `profiles` | Collected · App functionality |
| Messages (chat, DMs, chatbot) | `chat_messages`, `direct_messages`, `chatbot_conversations` | Collected · App functionality |
| Orders and requests (food, usher, errands) | `food_orders`, `usher_requests`, `errand_requests` | Collected · App functionality |
| Agenda / favourites | `my_agenda` | Collected · App functionality |
| **Precise location** | `directions.tsx` `navigator.geolocation` | Accessed on an explicit "GPS Locate" tap to compute directions; passed to Google Maps. Declare Location → Precise · App functionality · optional |
| IP / device info | Supabase, Vercel, Cloudflare Turnstile | Handled by processors — say so in the privacy policy |

Also declare: data is **encrypted in transit**; users **can request deletion**
(you must provide a deletion path — a support email is acceptable, but the
privacy policy has to state it); **no** data sold; **no** ads.

The privacy policy must name your processors: **Supabase** (database/auth),
**Vercel** (hosting), **Cloudflare Turnstile** (bot protection), **Google Maps**
(mapping and directions), and OpenAI-compatible AI for the concierge if it stays
enabled.

---

## Policy risk to keep in mind

Google's spam and functionality policies disallow an app that *merely* wraps a
website in a WebView without the site owner's permission, and apps with
"limited functionality". Here that is not a real risk — you own the site and the
app is a genuine multi-feature service (schedule, venue map, hotels, networking,
concierge) rather than a browser frame around a marketing page. Worth knowing
because it is the usual reason TWAs get rejected:
<https://support.google.com/googleplay/android-developer/answer/9899034>

---

## Rebuilding the bundle later

```bash
cd android
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
./gradlew bundleRelease
```

Bump `versionCode` (and usually `versionName`) in
[android/app/build.gradle](android/app/build.gradle) for every upload — Play
rejects a duplicate versionCode. **You do not need a new release for content
changes**; those come from the website.
