# Tester recruitment kit — closed test starts the moment 12 people join

Goal: **20–25 people opted in** (Google counters 12 *consecutive* days — buffer for people
who lose interest). Opt-in is two taps and the app itself is 3.7 MB.

---

## 1. WhatsApp / Telegram message (paste as-is)

```
Hello! 🙏

I just shipped "My Conference Companion" — companion app for the 2026
International Engineering Conference, Exhibition & AGM, Maiduguri
(schedule, speakers, venue map, live directions, hotels, AI concierge,
networking).

I need a small group of people to test it on their Android phones before
its public release. Everything you need to know:

⏱ Time commitment: literally 5 minutes now, occasional use for ~2 weeks.
📱 What you need: an Android phone (7.0+) + a Gmail address you can type to me now.
📲 Install: one link → tap "Join" → "Install". The app installs like any app.

If you can help, reply with "I'm in" + your Gmail address and I'll send
the opt-in link. First 25 people only 🚀

Thanks — [your name]
```

Post it in: the NSE conference WhatsApp groups, your branch's group, personal
LinkedIn (post version below), and directly to colleagues/friends who use Android.

## 2. LinkedIn post

```
My Conference Companion — our companion app for the 2026 International
Engineering Conference, Exhibition & AGM (Maiduguri) is ready for Android
testing ahead of public release.

Schedule · Speakers · Venue map · Live directions · Hotels · AI concierge ·
Networking.

Looking for 25 Android testers for a 2-week closed test. If you're
attending this year's conference (or just curious), drop your Gmail in the
comments or DM me and I'll send the opt-in link. Five minutes to set up.

#NSE #Engineering #Nigeria #Android #MobileApp
```

## 3. Direct DM / email to individuals

Shorter, personal:

```
Hi [Name] — can you help me test an Android app I'm about to release on
Google Play? It's the official companion app for this year's engineering
conference in Maiduguri (schedule, venue map, directions, AI assistant).

Setup = 1 link, tap "Join", tap "Install". I need testers logged in for
2 weeks — you'll get the finished app first, plus you'd genuinely help
hundreds of conference attendees have a smoother week.

If yes, send me your Gmail address and I'll send the link right away.
```

## 4. The follow-up message once someone says "I'm in"

```
Great — thanks! Two steps:

1. On the phone with that Gmail, open this link:
   [JOIN_LINK — paste it here once the internal tester link is live]
   and tap "Join" → "Continue".

2. Install from the Play Store page that appears.

That's it. If you can leave the app installed and open it once or twice a
week, that's everything. Bug or idea? Just reply here — real feedback
shapes the launch.
```

## 5. Tracker

Keep the tester list in `tester-recruitment/testers.csv` (template already
created). Columns: name, Gmail, date sent link, date joined, notes.
Once `Joined = yes` for 20+ rows, you're safe for the 14-day clock.

Quick sanity math: joined-date + 14 days = earliest production application
date. Recruit at least 4 people/day for the next 5 days and you launch on
schedule.

## 6. What counts and what doesn't (saves you a trap)

- **Counts:** Google account opened the Join link → tapped Join → app stays
  installed & they use it a bit. Same person opening the link twice ≠ two testers.
- **Doesn't count:** just being on the tester email list without tapping Join;
  opting out mid-test (restarts their 14-day clock if they rejoin).
- Aim high — some people will drop out; the buffer absorbs it.
