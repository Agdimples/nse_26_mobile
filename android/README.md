# Android wrapper (Trusted Web Activity)

This module packages the live My Conference Companion web app as an Android app for
Google Play. It contains **no web code**: a Trusted Web Activity (TWA) opens
`https://www.myconferencecompanion.com.ng` in Chrome full-screen, with no
browser UI, and Digital Asset Links prove the app and the site are owned by the
same developer. A deploy to the site is therefore immediately live in the app —
there is no second release to ship.

| | |
|---|---|
| Application ID | `com.orivonedge.conferencecompanion` |
| Launcher name | My Conference Companion |
| minSdk / targetSdk / compileSdk | 23 / **36** / 36 |
| Version | 1.0.0 (versionCode 1) |
| TWA library | `com.google.androidbrowserhelper:androidbrowserhelper:2.7.3` |

Play requires new apps to **target API 36** (from 31 Aug 2026), which is why
`targetSdk` is 36 rather than a year-old value.

> The application ID is **permanent**: it can never be changed after the first
> upload to Play. If you want a different one (`ng.com.*`, your own domain,
> etc.), change it now — in `app/build.gradle`, in `public/.well-known/assetlinks.json`,
> and in the `FILE_PROVIDER_AUTHORITY` / provider `authorities` value in the manifest.

## Build the upload bundle

Requires a JDK (Android Studio's bundled `jbr` works) and the Android SDK.

```bash
cd android
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"

./gradlew bundleRelease
# -> android/app/build/outputs/bundle/release/app-release.aab
```

`android/local.properties` holds the local Android SDK path and is git-ignored.
Use forward slashes (`sdk.dir=C:/Users/You/AppData/Local/Android/Sdk`) — Java
properties files treat `\` as an escape character, and doubled backslashes get
mangled easily.

## Signing keys

Two different keys are involved, and mixing them up is the classic TWA mistake:

| Key | Who holds it | What it proves |
|---|---|---|
| **Upload key** | you (`android/keystore/nse-upload.keystore`) | the bundle you uploaded came from you |
| **App signing key** | Google, under Play App Signing | the APK users actually install |

Create the upload key once:

```bash
powershell -ExecutionPolicy Bypass -File android/new-upload-key.ps1
```

It writes `android/keystore/nse-upload.keystore` and `android/keystore.properties`,
both git-ignored, and prints the certificate SHA-256. **Back both files up** —
they are not in GitHub. If the upload key is lost you must ask Google for an
upload-key reset before you can publish an update.

## Digital Asset Links — the step that makes it full-screen

The file `public/.well-known/assetlinks.json` must list **every** certificate that
signs an installed copy of the app:

1. **Upload key** — already present. This is what makes a locally
   `adb install`-ed build open without a URL bar.
2. **Play app signing key** — **still to add.** Collect it after the first
   upload: Play Console → *Test and release* → *App integrity* → *App signing key
   certificate* → SHA-256, then add it to the `sha256_cert_fingerprints` array and
   redeploy the site.

Until step 2 is done, the Play-installed app still works but shows a Chrome URL
bar across the top — that is the visible symptom of failed verification, and it
is why this file has to be updated *after* the first upload, not before.

Verify it is being served correctly:

```bash
curl -s https://www.myconferencecompanion.com.ng/.well-known/assetlinks.json
```

It must return HTTP 200 with `Content-Type: application/json`.

## FileProvider paths — the "has stopped" on open bug

The splash-screen handoff requires `<files-path path="twa_splash/" />` in
`app/src/main/res/xml/filepaths.xml`. It was missing from the first upload
(versionCode 2 → Play), and delegate testing produced an instant
"My Conference Companion has stopped" on open: the MU push (a binary)
simply crashes the host app when it is opened.

Fixed in versionCode 3 (versionName 1.0.2). **Never remove the `twa_splash`
entry from filepaths.xml** — the launcher's splash strategy writes the splash
image at files/twa_splash/splash_image.png and Chrome reads that path through
this FileProvider when it takes over the splash screen.

## Regenerating the launcher icons

The icons and the Play listing artwork are all generated from the **official NSE
crest** at `assets/nse-crest-512.png` - no design of our own:

```bash
powershell -ExecutionPolicy Bypass -File tool/gen_brand_artwork.ps1
```

This writes `android/app/src/main/res/mipmap-*/ic_launcher.png` (legacy,
crest on navy), `ic_launcher_foreground.png` (adaptive, transparent,
safe-zone padded), the web manifest icons in `public/icons/`, and the Play
listing art in `store/`.

The crest source is the official mark from
<https://nse.org.ng/wp-content/uploads/2024/11/icon-1.png> (512x512, transparent
background). The script strips a stray opaque fragment near the crest's
bottom-left corner with a connected-component pass and re-centres the emblem, so
do not replace that file with a re-crop without re-checking the result.
