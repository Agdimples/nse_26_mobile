"""Generate a 10-slide MaidGuide-focused PDF presentation for NSE '26.

Run:  python tools/make_presentation.py
Output: NSE26-App-Presentation.pdf (project root)
Screenshots: assets/presentation/screenshots/ (captured from the local app)
"""
import os
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.lib.colors import Color

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "NSE26-App-Presentation.pdf")

# 16:9 slide canvas (points)
W, H = 960.0, 540.0

# ---- Brand palette (from lib/theme/app_theme.dart) --------------------------
def hexc(h, a=1.0):
    h = h.lstrip("#")
    return Color(int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)

INK       = hexc("18201A")
INK_SOFT  = hexc("566057")
NAVY      = hexc("123E73")
NAVY_DARK = hexc("0C2A4F")
NAVY_SOFT = hexc("E6EEF7")
GREEN     = hexc("123F2A")
GREEN_SOFT= hexc("DFEEE4")
GOLD      = hexc("FFA000")
GOLD_SOFT = hexc("FFF4DC")
PAPER     = hexc("F3F4F6")
SURFACE   = hexc("FFFFFF")
WHITE     = hexc("FFFFFF")
RED       = hexc("C93D2E")
RED_SOFT  = hexc("FCECEA")

APP_ICON = os.path.join(ROOT, "public", "icons", "icon-512.png")
CREST    = os.path.join(ROOT, "public", "nse_crest.png")
SCREENSHOTS = os.path.join(ROOT, "assets", "presentation", "screenshots")

FONT   = "Helvetica"
FONTB  = "Helvetica-Bold"

c = canvas.Canvas(OUT, pagesize=(W, H))


# ---- primitives -------------------------------------------------------------
def bg(color=PAPER):
    c.setFillColor(color)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def soft_shadow_rect(x, y, w, h, r, fill):
    # fake soft shadow: a slightly larger, very light rect behind
    c.setFillColor(Color(0.11, 0.16, 0.27, 0.06))
    c.roundRect(x - 1, y - 5, w + 2, h + 2, r, fill=1, stroke=0)
    c.setFillColor(fill)
    c.roundRect(x, y, w, h, r, fill=1, stroke=0)


def text(x, y, s, font=FONT, size=12, color=INK, align="l"):
    c.setFont(font, size)
    c.setFillColor(color)
    if align == "l":
        c.drawString(x, y, s)
    elif align == "c":
        c.drawCentredString(x, y, s)
    else:
        c.drawRightString(x, y, s)


def paragraph(x, y, s, width, font=FONT, size=12, color=INK_SOFT, leading=None):
    leading = leading or size * 1.45
    lines = simpleSplit(s, font, size, width)
    c.setFont(font, size)
    c.setFillColor(color)
    for ln in lines:
        c.drawString(x, y, ln)
        y -= leading
    return y


def kicker_title(kicker, title, sub=None):
    # left accent bar
    c.setFillColor(GOLD)
    c.roundRect(64, H - 96, 6, 46, 3, fill=1, stroke=0)
    text(84, H - 66, kicker.upper(), FONTB, 12, GOLD)
    text(84, H - 92, title, FONTB, 30, NAVY_DARK)
    if sub:
        text(84, H - 114, sub, FONT, 13, INK_SOFT)


def footer(page, total):
    c.setStrokeColor(hexc("D8DCE3"))
    c.setLineWidth(1)
    c.line(64, 40, W - 64, 40)
    text(64, 26, "MaidGuide  ·  NSE '26 Official Conference App", FONT, 9, INK_SOFT)
    text(W - 64, 26, f"{page} / {total}", FONT, 9, INK_SOFT, align="r")


def feature_tile(x, y, w, h, title, body, accent, accent_soft, glyph=""):
    soft_shadow_rect(x, y, w, h, 16, SURFACE)
    # icon disc
    d = 34
    c.setFillColor(accent_soft)
    c.roundRect(x + 18, y + h - 18 - d, d, d, 10, fill=1, stroke=0)
    c.setFillColor(accent)
    c.circle(x + 18 + d / 2, y + h - 18 - d / 2, 5, fill=1, stroke=0)
    text(x + 18 + d + 12, y + h - 30, title, FONTB, 14, INK)
    paragraph(x + 18, y + h - 52, body, w - 36, FONT, 10.5, INK_SOFT, leading=15)


def draw_image_contain(path, x, y, w, h):
    img = ImageReader(path)
    iw, ih = img.getSize()
    scale = min(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh,
                preserveAspectRatio=True, mask="auto")


# =============================================================================
# SLIDE 1 — COVER
# =============================================================================
def slide_cover():
    # navy gradient-ish background (bands)
    bg(NAVY_DARK)
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H * 0.62, fill=1, stroke=0)
    c.setFillColor(NAVY_DARK)
    c.rect(0, 0, W, H * 0.30, fill=1, stroke=0)
    # gold accent line
    c.setFillColor(GOLD)
    c.rect(0, H - 6, W, 6, fill=1, stroke=0)

    # right-side crest watermark (drawn first so text sits above it)
    draw_image_contain(CREST, W - 290, 150, 215, 270)

    # app icon in a rounded white card
    card = 138
    cx = 84
    cy = H - 66 - card
    c.setFillColor(WHITE)
    c.roundRect(cx, cy, card, card, 32, fill=1, stroke=0)
    draw_image_contain(APP_ICON, cx + 13, cy + 13, card - 26, card - 26)

    text(84, cy - 42, "OFFICIAL CONFERENCE COMPANION APP", FONTB, 13, GOLD)
    text(82, cy - 92, "NSE International", FONTB, 48, WHITE)
    text(82, cy - 142, "Conference 2026", FONTB, 48, WHITE)

    text(84, 150, "Engineering Innovation for Enhanced Security", FONT, 14.5, NAVY_SOFT)
    text(84, 128, "and Sustainable National Development", FONT, 14.5, NAVY_SOFT)

    # detail chips
    def chip(x, label, value):
        c.setFillColor(Color(1, 1, 1, 0.10))
        c.roundRect(x, 52, 224, 48, 12, fill=1, stroke=0)
        text(x + 16, 82, label.upper(), FONTB, 8.5, GOLD)
        text(x + 16, 64, value, FONTB, 12.5, WHITE)
    chip(84, "Dates", "30 Nov \u2013 4 Dec 2026")
    chip(324, "Venue", "ICC, Maiduguri")
    chip(564, "Platform", "Android \u00b7 iOS")


# =============================================================================
# SLIDE 2 — OVERVIEW
# =============================================================================
def slide_overview(page, total):
    bg()
    kicker_title("Overview", "One app for the entire conference")
    y = paragraph(
        84, H - 150,
        "NSE '26 puts everything a delegate needs in one place \u2014 the programme, speakers, "
        "accommodation, the venue map, concierge services and live updates \u2014 while giving the "
        "organising committee a built-in admin console to run the event in real time. It is designed "
        "to work reliably in Maiduguri, with key content bundled for offline use.",
        W - 168, FONT, 13.5, INK_SOFT, leading=21)

    cols = [
        ("For delegates", "A premium, bank-app-grade experience: plan your days, find rooms, "
         "book services and stay informed.", NAVY, NAVY_SOFT),
        ("For organisers", "Role-based admin tools to manage sessions, hotels, menus, "
         "announcements and live service queues.", GREEN, GREEN_SOFT),
        ("Built to last", "Offline-ready assets, secure sign-in and a consistent design system "
         "across every screen.", GOLD, GOLD_SOFT),
    ]
    tw = (W - 168 - 2 * 24) / 3
    for i, (t, b, ac, acs) in enumerate(cols):
        x = 84 + i * (tw + 24)
        feature_tile(x, 90, tw, 150, t, b, ac, acs)
    footer(page, total)


# =============================================================================
# SLIDE 3 — AT A GLANCE (stats)
# =============================================================================
def slide_stats(page, total):
    bg()
    kicker_title("At a glance", "Two products in a single app")
    stats = [
        ("2-in-1", "Delegate app +\nadmin console", NAVY, NAVY_SOFT),
        ("30+", "Fully designed\nscreens & flows", GREEN, GREEN_SOFT),
        ("20+", "Hotels ranked,\nwith photo galleries", GOLD, GOLD_SOFT),
        ("Indoor", "Venue wayfinding\nwith \u201cyou are here\u201d", NAVY, NAVY_SOFT),
        ("Offline", "Maps & plans\nbundled in-app", GREEN, GREEN_SOFT),
        ("Live", "Real-time queues\n& announcements", GOLD, GOLD_SOFT),
    ]
    cols, rows = 3, 2
    gap = 24
    tw = (W - 168 - (cols - 1) * gap) / cols
    th = 130
    top = H - 170
    for i, (big, lbl, ac, acs) in enumerate(stats):
        r, cc = divmod(i, cols)
        x = 84 + cc * (tw + gap)
        y = top - r * (th + gap) - th
        soft_shadow_rect(x, y, tw, th, 16, SURFACE)
        c.setFillColor(acs)
        c.roundRect(x, y, 8, th, 4, fill=1, stroke=0)
        text(x + 26, y + th - 46, big, FONTB, 34, ac)
        yy = y + th - 74
        for line in lbl.split("\n"):
            text(x + 26, yy, line, FONT, 12, INK_SOFT)
            yy -= 17
    footer(page, total)


# =============================================================================
# Generic feature slide (2x2 tiles)
# =============================================================================
def feature_slide(page, total, kicker, title, tiles):
    bg()
    kicker_title(kicker, title)
    gap = 22
    tw = (W - 168 - gap) / 2
    th = 120
    top = H - 168
    for i, (t, b, ac, acs) in enumerate(tiles):
        r, cc = divmod(i, 2)
        x = 84 + cc * (tw + gap)
        y = top - r * (th + gap) - th
        feature_tile(x, y, tw, th, t, b, ac, acs)
    footer(page, total)


# =============================================================================
# SLIDE — Design & brand
# =============================================================================
def slide_design(page, total):
    bg()
    kicker_title("Design & quality", "A deliberate, premium design system")
    y = paragraph(
        84, H - 150,
        "Every screen shares one visual language: soft, borderless cards floating on a light canvas, "
        "generous spacing, a single accent-driven navigation, and consistent typography \u2014 the same "
        "attention to detail you expect from a modern banking app.",
        W - 168, FONT, 13, INK_SOFT, leading=20)

    text(84, y - 6, "OFFICIAL PALETTE", FONTB, 11, NAVY_DARK)
    swatches = [
        ("Navy", NAVY, "#123E73"),
        ("Navy dark", NAVY_DARK, "#0C2A4F"),
        ("Gold", GOLD, "#FFA000"),
        ("Green", GREEN, "#123F2A"),
        ("Paper", PAPER, "#F3F4F6"),
    ]
    sx = 84
    sy = y - 120
    sw = 150
    for name, col, hx in swatches:
        soft_shadow_rect(sx, sy, sw, 92, 14, SURFACE)
        c.setFillColor(col)
        c.roundRect(sx + 12, sy + 34, sw - 24, 44, 10, fill=1, stroke=1 if name == "Paper" else 0)
        if name == "Paper":
            c.setStrokeColor(hexc("D8DCE3"))
        text(sx + 14, sy + 20, name, FONTB, 11, INK)
        text(sx + 14, sy + 8, hx, FONT, 8.5, INK_SOFT)
        sx += sw + 16
    footer(page, total)


# =============================================================================
# SLIDE — Technology
# =============================================================================
def slide_tech(page, total):
    bg()
    kicker_title("Technology", "Built for reliability in the field")
    tiles = [
        ("Flutter (Android & iOS)", "One codebase, native performance, a single consistent UI on every device.", NAVY, NAVY_SOFT),
        ("Supabase backend", "Secure authentication, live data and real-time service queues.", GREEN, GREEN_SOFT),
        ("Offline-first assets", "Hotel galleries, venue plans and the 3D tour are bundled inside the app.", GOLD, GOLD_SOFT),
        ("Role-based access", "Admin tools are gated by role: program, logistics, kitchen, comms, front desk.", NAVY, NAVY_SOFT),
    ]
    gap = 22
    tw = (W - 168 - gap) / 2
    th = 116
    top = H - 168
    for i, (t, b, ac, acs) in enumerate(tiles):
        r, cc = divmod(i, 2)
        x = 84 + cc * (tw + gap)
        yy = top - r * (th + gap) - th
        feature_tile(x, yy, tw, th, t, b, ac, acs)
    footer(page, total)


# =============================================================================
# SLIDE — Closing
# =============================================================================
def slide_closing():
    bg(NAVY_DARK)
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H * 0.45, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H - 6, W, 6, fill=1, stroke=0)
    draw_image_contain(APP_ICON, W / 2 - 55, H - 190, 110, 110)
    text(W / 2, H - 250, "Ready for delegates.", FONTB, 34, WHITE, align="c")
    text(W / 2, H - 288, "Ready for the committee.", FONTB, 34, WHITE, align="c")
    text(W / 2, 150, "NSE International Conference 2026", FONTB, 15, GOLD, align="c")
    text(W / 2, 126, "International Conference Centre · Maiduguri, Borno State", FONT, 12, NAVY_SOFT, align="c")
    text(W / 2, 92, "30 November – 4 December 2026", FONT, 12, NAVY_SOFT, align="c")


def phone_screenshot(name, x, y, width=208):
    """Place an actual mobile app capture inside a presentation phone frame."""
    path = os.path.join(SCREENSHOTS, f"{name}.png")
    image = ImageReader(path)
    iw, ih = image.getSize()
    screen_w = width - 12
    screen_h = screen_w * ih / iw
    frame_h = screen_h + 12

    c.setFillColor(Color(0.05, 0.10, 0.17, 0.20))
    c.roundRect(x + 2, y - 4, width, frame_h + 4, 25, fill=1, stroke=0)
    c.setFillColor(hexc("101820"))
    c.roundRect(x, y, width, frame_h, 24, fill=1, stroke=0)
    screen_x, screen_y = x + 6, y + 6
    clip = c.beginPath()
    clip.roundRect(screen_x, screen_y, screen_w, screen_h, 18)
    c.saveState()
    c.clipPath(clip, stroke=0, fill=0)
    c.drawImage(image, screen_x, screen_y, screen_w, screen_h)
    c.restoreState()
    return frame_h


def slide_intro():
    bg(NAVY_DARK)
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H * 0.55, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H - 6, W, 6, fill=1, stroke=0)
    draw_image_contain(APP_ICON, 76, H - 126, 66, 66)
    text(76, H - 151, "NSE '26  ·  OFFICIAL CONFERENCE APP", FONTB, 10.5, GOLD)
    text(76, H - 214, "MaidGuide", FONTB, 48, WHITE)
    text(76, H - 252, "Maiduguri made easier.", FONTB, 26, WHITE)
    paragraph(78, H - 294,
              "A simpler way to find your way around the city, reach the venue "
              "and make the most of every conference day.",
              475, FONT, 15, NAVY_SOFT, leading=23)
    text(78, 118, "30 NOV – 4 DEC 2026", FONTB, 11, GOLD)
    text(78, 97, "International Conference Centre · Maiduguri", FONT, 11, WHITE)
    phone_screenshot("maidguide", 690, 34, 218)


def slide_journey(page, total):
    bg()
    kicker_title("The delegate experience", "Conference days should feel simple",
                 "One guide connects the city, the venue and the activities that bring everyone together.")
    stages = [
        ("01", "Arrive with a plan", "Find a place to stay and understand your options before setting out.", NAVY, NAVY_SOFT),
        ("02", "Get around confidently", "See routes, nearby services and shuttle details without juggling separate searches.", GREEN, GREEN_SOFT),
        ("03", "Focus on the conference", "Find the right room, keep up with the programme and spend more time participating.", GOLD, GOLD_SOFT),
    ]
    gap = 20
    tw = (W - 168 - 2 * gap) / 3
    for i, (num, title, body, accent, tint) in enumerate(stages):
        x = 84 + i * (tw + gap)
        soft_shadow_rect(x, 132, tw, 170, 16, SURFACE)
        c.setFillColor(tint)
        c.circle(x + 38, 264, 19, fill=1, stroke=0)
        text(x + 38, 260, num, FONTB, 10, accent, align="c")
        text(x + 22, 222, title, FONTB, 16, INK)
        paragraph(x + 22, 196, body, tw - 44, FONT, 11.5, INK_SOFT, leading=17)
    text(84, 83, "Less time figuring things out. More time being there.", FONTB, 17, NAVY_DARK)
    footer(page, total)


def slide_maidguide(page, total):
    bg()
    kicker_title("Meet MaidGuide", "Your starting point for Maiduguri",
                 "City essentials and conference-day help, organized in one familiar place.")
    phone_screenshot("maidguide", 706, 50, 204)
    items = [
        ("3D Venue & Map", "Explore ICC floor plans, the wider city map, hotels and local places.", NAVY, NAVY_SOFT),
        ("Live Directions", "Choose walk or drive routes and start navigation for a destination.", GOLD, GOLD_SOFT),
        ("Hotels & nearby places", "Browse stays, restaurants, hospitals, security and other points of interest.", GREEN, GREEN_SOFT),
        ("Shuttle & FAQ", "Check the daily transport schedule and quickly find practical conference answers.", NAVY, NAVY_SOFT),
    ]
    y = 344
    for title, body, accent, tint in items:
        c.setFillColor(tint)
        c.roundRect(84, y - 1, 34, 34, 10, fill=1, stroke=0)
        c.setFillColor(accent)
        c.circle(101, y + 16, 5, fill=1, stroke=0)
        text(132, y + 17, title, FONTB, 14, INK)
        paragraph(132, y - 3, body, 500, FONT, 10.5, INK_SOFT, leading=15)
        y -= 75
    footer(page, total)


def slide_city(page, total):
    bg()
    kicker_title("Explore the city", "Find your way across Maiduguri",
                 "A useful city guide for the moments before, between and after conference sessions.")
    phone_screenshot("directions", 706, 50, 204)
    feature_tile(84, 292, 540, 84, "Choose how to travel",
                 "Switch between walking and driving, then compare route distance and estimated time.",
                 NAVY, NAVY_SOFT)
    feature_tile(84, 188, 540, 84, "Start with a destination",
                 "Open directions from a hotel or nearby place and continue navigation in Google Maps.",
                 GREEN, GREEN_SOFT)
    feature_tile(84, 84, 540, 84, "Know what's around you",
                 "Discover restaurants, hospitals, pharmacies, security and other local points of interest.",
                 GOLD, GOLD_SOFT)
    footer(page, total)


def slide_stays(page, total):
    bg()
    kicker_title("Stay & discover", "Choose a stay that fits",
                 "Turn the hotel search into a practical decision, then get directions when you're ready.")
    phone_screenshot("hotels", 706, 50, 204)
    facts = [
        ("40", "hotels in the official delegate masterlist"),
        ("Photos", "see property galleries alongside location details"),
        ("Sort", "ranked, nearest or cheapest options"),
        ("Next step", "open directions from a hotel listing"),
    ]
    y = 342
    for value, label in facts:
        soft_shadow_rect(84, y - 28, 540, 58, 13, SURFACE)
        text(104, y - 1, value, FONTB, 16, NAVY)
        text(226, y - 1, label, FONT, 11.5, INK_SOFT)
        y -= 76
    footer(page, total)


def slide_shuttles(page, total):
    bg()
    kicker_title("Conference transport", "Make the hotel-to-venue trip clearer",
                 "Keep shuttle routes, pickup details and the day’s timetable close at hand.")
    phone_screenshot("transport", 706, 50, 204)
    rows = [
        ("Bus directory", "Browse the saved route list and find a bus or hotel."),
        ("Daily schedule", "Check planned morning, midday, afternoon and evening runs."),
        ("Pickup context", "Review route labels, hotel associations and marshal details where available."),
    ]
    y = 337
    for i, (title, body) in enumerate(rows, 1):
        c.setFillColor(NAVY_SOFT if i == 1 else GREEN_SOFT if i == 2 else GOLD_SOFT)
        c.circle(103, y + 7, 17, fill=1, stroke=0)
        text(103, y + 3, str(i), FONTB, 10, NAVY_DARK, align="c")
        text(136, y + 12, title, FONTB, 14, INK)
        paragraph(136, y - 9, body, 474, FONT, 11, INK_SOFT, leading=16)
        y -= 90
    paragraph(84, 77,
              "Transport availability can change; the app keeps the saved route list visible when live data is unavailable.",
              540, FONT, 9.5, INK_SOFT, leading=14)
    footer(page, total)


def slide_venue(page, total):
    bg()
    kicker_title("At the International Conference Centre", "Find the right room, faster",
                 "The venue map brings floor plans, room search and site context into the same app.")
    phone_screenshot("map", 706, 50, 204)
    feature_tile(84, 300, 540, 78, "Browse both floors",
                 "Switch between ground and first-floor plans without leaving the map.",
                 NAVY, NAVY_SOFT)
    feature_tile(84, 202, 540, 78, "Search rooms & facilities",
                 "Find mapped spaces, with 38 rooms shown on the venue plan.",
                 GREEN, GREEN_SOFT)
    feature_tile(84, 104, 540, 78, "Choose the view you need",
                 "Move between floor plans, the site plan, route view and outdoor map.",
                 GOLD, GOLD_SOFT)
    footer(page, total)


def slide_activities(page, total):
    bg()
    kicker_title("Make the most of the programme", "Keep conference activities within reach",
                 "MaidGuide supports the full delegate day—not just the trip to the venue.")
    phone_screenshot("schedule", 706, 50, 204)
    feature_tile(84, 300, 540, 78, "See each day at a glance",
                 "Browse the programme by conference day and discover sessions, events and locations.",
                 NAVY, NAVY_SOFT)
    feature_tile(84, 202, 540, 78, "Filter by track",
                 "Narrow the schedule to the activities most relevant to you.",
                 GREEN, GREEN_SOFT)
    feature_tile(84, 104, 540, 78, "Save sessions as you go",
                 "Bookmark programme items to shape a more personal conference agenda.",
                 GOLD, GOLD_SOFT)
    footer(page, total)


def slide_end_to_end(page, total):
    bg(NAVY_DARK)
    c.setFillColor(GOLD)
    c.rect(0, H - 6, W, 6, fill=1, stroke=0)
    text(84, H - 75, "ONE CONTINUOUS DELEGATE JOURNEY", FONTB, 11, GOLD)
    text(84, H - 114, "From arrival to the last session.", FONTB, 29, WHITE)
    paragraph(84, H - 148,
              "MaidGuide brings the practical pieces of a conference visit together, "
              "so delegates can move with more confidence and less friction.",
              700, FONT, 13, NAVY_SOFT, leading=19)
    steps = [
        ("Find a stay", "Compare hotels"),
        ("Get around", "Routes & nearby places"),
        ("Reach the ICC", "Shuttles & directions"),
        ("Join in", "Rooms & programme"),
    ]
    x0, y, gap = 84, 252, 24
    tw = (W - 168 - 3 * gap) / 4
    for i, (title, body) in enumerate(steps):
        x = x0 + i * (tw + gap)
        c.setFillColor(Color(1, 1, 1, 0.09))
        c.roundRect(x, y, tw, 105, 14, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.circle(x + 22, y + 76, 11, fill=1, stroke=0)
        text(x + 22, y + 72, str(i + 1), FONTB, 9, NAVY_DARK, align="c")
        text(x + 16, y + 47, title, FONTB, 13, WHITE)
        paragraph(x + 16, y + 27, body, tw - 32, FONT, 10, NAVY_SOFT, leading=14)
        if i < 3:
            text(x + tw + gap / 2, y + 49, "→", FONTB, 16, GOLD, align="c")
    text(84, 164, "A smoother visit, from door to door.", FONTB, 22, WHITE)
    text(84, 133, "Built around the delegate, all in one place.", FONTB, 16, GOLD)
    c.setStrokeColor(Color(1, 1, 1, 0.18))
    c.line(64, 40, W - 64, 40)
    text(64, 26, "MaidGuide  ·  NSE '26 Official Conference App", FONT, 9, NAVY_SOFT)
    text(W - 64, 26, f"{page} / {total}", FONT, 9, NAVY_SOFT, align="r")


def slide_final():
    bg(NAVY_DARK)
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H * 0.44, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H - 6, W, 6, fill=1, stroke=0)
    draw_image_contain(APP_ICON, 84, H - 160, 76, 76)
    text(84, H - 200, "MaidGuide", FONTB, 14, GOLD)
    text(84, H - 263, "Find your way.", FONTB, 38, WHITE)
    text(84, H - 308, "Focus on the conference.", FONTB, 31, WHITE)
    paragraph(86, H - 346,
              "Your city and conference companion for the NSE International Conference 2026.",
              475, FONT, 13, NAVY_SOFT, leading=20)
    text(86, 108, "30 NOV – 4 DEC 2026", FONTB, 11, GOLD)
    text(86, 86, "International Conference Centre · Maiduguri", FONT, 11, WHITE)
    phone_screenshot("maidguide", 690, 34, 218)


# =============================================================================
# BUILD — 10 slides
# =============================================================================
TOTAL = 10

slide_intro(); c.showPage()
slide_journey(2, TOTAL); c.showPage()
slide_maidguide(3, TOTAL); c.showPage()
slide_city(4, TOTAL); c.showPage()
slide_stays(5, TOTAL); c.showPage()
slide_shuttles(6, TOTAL); c.showPage()
slide_venue(7, TOTAL); c.showPage()
slide_activities(8, TOTAL); c.showPage()
slide_end_to_end(9, TOTAL); c.showPage()
slide_final(); c.showPage()

c.save()
print("WROTE", OUT)
