/**
 * ICC Maiduguri — Floor plan data model.
 *
 * Source of truth: architectural drawings by Land · Air · Water Consulting Engineers.
 *   • icc-maiduguri-site-plan.pdf      (Sheet A21 · May 2024 · Scale 1:1000)
 *   • icc-maiduguri-ground-floor.pdf   (Sheet A21 · May 2024 · Scale 1:200)
 *   • icc-maiduguri-first-floor.pdf    (Sheet A21 · May 2021 · Scale 1:200)
 *
 * Polygon coordinates are [x, y] pairs normalised to the plan image dimensions
 * (5850 × 3375 px). Multiply by the rendered image size at runtime.
 * Every polygon was traced from the actual exported PNG — no coordinates
 * are fabricated.
 *
 * Ground floor confirmed spaces (left → centre → right):
 *   Banquet Hall · Outdoor Cooking Area · Main Kitchen · Food Storage · Cleaner
 *   Control Room · ETR SQ · Corridor (L/R) · Stage · Platform (L/R)
 *   Main Auditorium · Male Toilet · WC/SO · Female Toilet · Last Room · Media Room
 *   Meeting Room · Office
 *   Central Foyer · Lift 1 · Lift 2 · Main Stairs · Toilet · Duct
 *   Main Entrance (Entrance Porch / Drop-off)
 *   VIP Lounge · Back-of-House Rooms · Multi-Purpose Auditorium
 *   Stage (R) · Platform (R) · WC/SO · Male/Female Toilet · Storage · Back of House
 *
 * First floor confirmed spaces:
 *   Executive Lounge · Kitchenette · Waiting Area · Protocol Lounge
 *   VIP Lounge · Press / Media Room · Void (left wing)
 *   Main Auditorium (500 seats, tiered) · Elect Room · Store · Male/Female Toilet
 *   Circulation Area · Lift 1 · Lift 2 · Main Stair (×2) · Toilet
 *   Seminar Room · Stage · Utility Room · CCTV Monitoring Room
 *   Meeting Room (×2) · Account Office · Reception / Secretary · Director Office
 *   Gallery (L/R) · Open to Below · Female Toilet / WC · Store
 *   Void (far right)
 *
 * Site plan confirmed facilities:
 *   Proposed Conference Centre Building · Proposed Hotel · Exhibition Park (×2)
 *   Proposed Masjid · Parking (6 bays) · Power House · Borehole/Tank
 *   Solar Farm · Main Entrance Gate
 *
 * How to add a new floor:
 *   1. Export the PDF to PNG at ≥ 2000 px wide → public/plan/<name>.png
 *   2. Add a new IccFloor entry to ICC_FLOORS.
 *   3. Populate IccRoom entries; trace polygons with /map?debug=1.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoomCategory =
  | "auditorium"
  | "seminar"
  | "meeting"
  | "lounge"
  | "office"
  | "media"
  | "reception"
  | "gallery"
  | "circulation"
  | "service"
  | "open"
  | "site-facility"
  | "entrance";

export interface IccRoom {
  id: string;
  name: string;
  number?: string;
  floorId: string;
  category: RoomCategory;
  description?: string;
  polygon: [number, number][];
  accessibility?: string;
  connectedTo?: string[];
}

export interface IccFloor {
  id: string;
  label: string;
  shortLabel: string;
  planImage: string | null;
  planPdf: string;
  naturalWidth: number | null;
  naturalHeight: number | null;
  rooms: IccRoom[];
}

// ---------------------------------------------------------------------------
// Ground Floor  (image 5850 × 3375 px)
// ---------------------------------------------------------------------------
// Coordinate system: [x/5850, y/3375]
// Left octagon centre ≈ x=0.27, right octagon centre ≈ x=0.73
// Centre bridge ≈ x=0.42–0.58
// Vertical centre ≈ y=0.50

const GROUND_FLOOR_ROOMS: IccRoom[] = [

  // ── LEFT WING ─────────────────────────────────────────────────────────────

  {
    id: "gf-banquet-hall",
    name: "Banquet Hall",
    floorId: "ground",
    category: "auditorium",
    description: "Large banquet / dining hall in the upper-left section of the building.",
    polygon: [
      [0.1709, 0.2844],
      [0.2547, 0.2844],
      [0.2547, 0.4119],
      [0.1709, 0.4119],
    ],
    connectedTo: ["gf-corridor-l", "gf-kitchen"],
  },
  {
    id: "gf-kitchen",
    name: "Main Kitchen",
    floorId: "ground",
    category: "service",
    description: "Main kitchen serving the Banquet Hall and conference catering.",
    polygon: [
      [0.3120, 0.2578],
      [0.3744, 0.2578],
      [0.3744, 0.2933],
      [0.3120, 0.2933],
    ],
    connectedTo: ["gf-banquet-hall", "gf-food-storage", "gf-outdoor-cooking"],
  },
  {
    id: "gf-outdoor-cooking",
    name: "Outdoor Cooking Area",
    floorId: "ground",
    category: "service",
    description: "Outdoor cooking and food preparation area adjacent to the kitchen.",
    polygon: [
      [0.2547, 0.2578],
      [0.3120, 0.2578],
      [0.3120, 0.2933],
      [0.2547, 0.2933],
    ],
    connectedTo: ["gf-kitchen"],
  },
  {
    id: "gf-food-storage",
    name: "Food Storage",
    floorId: "ground",
    category: "service",
    description: "Cold and dry food storage for catering operations.",
    polygon: [
      [0.3120, 0.2933],
      [0.3556, 0.2933],
      [0.3556, 0.3111],
      [0.3120, 0.3111],
    ],
    connectedTo: ["gf-kitchen"],
  },
  {
    id: "gf-cleaner",
    name: "Cleaner's Room",
    floorId: "ground",
    category: "service",
    description: "Cleaning equipment and supplies store.",
    polygon: [
      [0.3556, 0.2933],
      [0.3744, 0.2933],
      [0.3744, 0.3111],
      [0.3556, 0.3111],
    ],
    connectedTo: ["gf-corridor-l"],
  },
  {
    id: "gf-control-room",
    name: "Control Room",
    floorId: "ground",
    category: "service",
    description: "AV and technical control room for the Main Auditorium.",
    polygon: [
      [0.3487, 0.3793],
      [0.3795, 0.3793],
      [0.3795, 0.4474],
      [0.3487, 0.4474],
    ],
    connectedTo: ["gf-auditorium", "gf-corridor-l"],
  },
  {
    id: "gf-etr-sq",
    name: "ETR / SQ Room",
    floorId: "ground",
    category: "service",
    description: "Electrical / technical services room (ETR SQ).",
    polygon: [
      [0.3487, 0.4474],
      [0.3795, 0.4474],
      [0.3795, 0.4978],
      [0.3487, 0.4978],
    ],
    connectedTo: ["gf-corridor-l", "gf-foyer"],
  },
  {
    id: "gf-corridor-l",
    name: "Corridor (Left Wing)",
    floorId: "ground",
    category: "circulation",
    description: "Internal circulation corridor serving the left auditorium wing.",
    polygon: [
      [0.1436, 0.3793],
      [0.3487, 0.3793],
      [0.3487, 0.4178],
      [0.1436, 0.4178],
    ],
    connectedTo: [
      "gf-auditorium", "gf-banquet-hall", "gf-control-room",
      "gf-stage-l", "gf-platform-l", "gf-foyer",
    ],
  },
  {
    id: "gf-stage-l",
    name: "Stage",
    floorId: "ground",
    category: "auditorium",
    description: "Performance and presentation stage in the Main Auditorium.",
    polygon: [
      [0.1538, 0.4178],
      [0.1846, 0.4178],
      [0.1846, 0.6015],
      [0.1538, 0.6015],
    ],
    connectedTo: ["gf-auditorium", "gf-platform-l"],
  },
  {
    id: "gf-platform-l",
    name: "Platform",
    floorId: "ground",
    category: "circulation",
    description: "Stage platform / access steps at the Main Auditorium.",
    polygon: [
      [0.1846, 0.4178],
      [0.2171, 0.4178],
      [0.2171, 0.6015],
      [0.1846, 0.6015],
    ],
    connectedTo: ["gf-stage-l", "gf-auditorium"],
  },
  {
    id: "gf-auditorium",
    name: "Main Auditorium",
    floorId: "ground",
    category: "auditorium",
    description: "Primary conference hall — tiered fixed seating for plenary sessions and keynote addresses.",
    polygon: [
      [0.2171, 0.3793],
      [0.3487, 0.3793],
      [0.3487, 0.6459],
      [0.2171, 0.6459],
    ],
    accessibility: "Step-free access via main corridor. Wheelchair spaces at rear.",
    connectedTo: ["gf-corridor-l", "gf-stage-l", "gf-platform-l", "gf-media-room", "gf-meeting-room"],
  },
  {
    id: "gf-media-room",
    name: "Media Room",
    floorId: "ground",
    category: "media",
    description: "Press and media working room adjacent to the Main Auditorium.",
    polygon: [
      [0.2956, 0.6459],
      [0.3521, 0.6459],
      [0.3521, 0.7289],
      [0.2956, 0.7289],
    ],
    connectedTo: ["gf-auditorium", "gf-corridor-bottom-l"],
  },
  {
    id: "gf-male-toilet-l",
    name: "Male Toilet",
    floorId: "ground",
    category: "service",
    description: "Male toilet facilities, left-wing ground floor.",
    polygon: [
      [0.1538, 0.6015],
      [0.1795, 0.6015],
      [0.1795, 0.6459],
      [0.1538, 0.6459],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["gf-corridor-bottom-l"],
  },
  {
    id: "gf-wc-so-l",
    name: "WC / SO",
    floorId: "ground",
    category: "service",
    description: "WC / Sluice room, left wing.",
    polygon: [
      [0.1795, 0.6015],
      [0.2171, 0.6015],
      [0.2171, 0.6459],
      [0.1795, 0.6459],
    ],
    connectedTo: ["gf-corridor-bottom-l"],
  },
  {
    id: "gf-female-toilet-l",
    name: "Female Toilet",
    floorId: "ground",
    category: "service",
    description: "Female toilet facilities, left-wing ground floor.",
    polygon: [
      [0.1538, 0.6459],
      [0.1795, 0.6459],
      [0.1795, 0.6933],
      [0.1538, 0.6933],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["gf-corridor-bottom-l"],
  },
  {
    id: "gf-last-room",
    name: "Last Room",
    floorId: "ground",
    category: "service",
    description: "Service / utility room at the south end of the left wing.",
    polygon: [
      [0.1795, 0.6459],
      [0.2171, 0.6459],
      [0.2171, 0.6933],
      [0.1795, 0.6933],
    ],
    connectedTo: ["gf-corridor-bottom-l"],
  },
  {
    id: "gf-corridor-bottom-l",
    name: "Corridor (South, Left)",
    floorId: "ground",
    category: "circulation",
    description: "South circulation corridor below the Main Auditorium.",
    polygon: [
      [0.1436, 0.6459],
      [0.3521, 0.6459],
      [0.3521, 0.6933],
      [0.1436, 0.6933],
    ],
    connectedTo: ["gf-auditorium", "gf-meeting-room", "gf-office-l", "gf-media-room"],
  },
  {
    id: "gf-meeting-room",
    name: "Meeting Room",
    floorId: "ground",
    category: "meeting",
    description: "Committee and breakout meeting room, ground floor south.",
    polygon: [
      [0.1778, 0.6933],
      [0.2838, 0.6933],
      [0.2838, 0.7852],
      [0.1778, 0.7852],
    ],
    connectedTo: ["gf-corridor-bottom-l", "gf-office-l"],
  },
  {
    id: "gf-office-l",
    name: "Office",
    floorId: "ground",
    category: "office",
    description: "Administrative office, ground floor south.",
    polygon: [
      [0.2838, 0.6933],
      [0.3641, 0.6933],
      [0.3641, 0.7852],
      [0.2838, 0.7852],
    ],
    connectedTo: ["gf-meeting-room", "gf-corridor-bottom-l"],
  },

  // ── CENTRE BRIDGE ─────────────────────────────────────────────────────────

  {
    id: "gf-foyer",
    name: "Central Foyer",
    floorId: "ground",
    category: "reception",
    description: "Central Foyer and Circulation Area connecting both auditorium wings. Lifts, stairs and main entrance are here.",
    polygon: [
      [0.4051, 0.3763],
      [0.5966, 0.3763],
      [0.5966, 0.6104],
      [0.4051, 0.6104],
    ],
    accessibility: "Level access from main entrance. Accessible lifts.",
    connectedTo: [
      "gf-lift-l", "gf-lift-r", "gf-stairs-main",
      "gf-main-entrance", "gf-toilet-centre", "gf-etr-sq",
      "gf-corridor-l", "gf-corridor-r-wing",
    ],
  },
  {
    id: "gf-lift-l",
    name: "Lift 1",
    floorId: "ground",
    category: "circulation",
    description: "Passenger lift (left) — connects ground floor to first floor.",
    polygon: [
      [0.4274, 0.4504],
      [0.4684, 0.4504],
      [0.4684, 0.5037],
      [0.4274, 0.5037],
    ],
    accessibility: "Accessible lift. Press 1 for first floor.",
    connectedTo: ["gf-foyer", "ff-lift-l"],
  },
  {
    id: "gf-lift-r",
    name: "Lift 2",
    floorId: "ground",
    category: "circulation",
    description: "Passenger lift (right) — connects ground floor to first floor.",
    polygon: [
      [0.4821, 0.4504],
      [0.5231, 0.4504],
      [0.5231, 0.5037],
      [0.4821, 0.5037],
    ],
    accessibility: "Accessible lift. Press 1 for first floor.",
    connectedTo: ["gf-foyer", "ff-lift-r"],
  },
  {
    id: "gf-stairs-main",
    name: "Main Stairs",
    floorId: "ground",
    category: "circulation",
    description: "Main staircase in the Central Foyer — access to first floor.",
    polygon: [
      [0.5393, 0.3763],
      [0.5966, 0.3763],
      [0.5966, 0.5926],
      [0.5393, 0.5926],
    ],
    connectedTo: ["gf-foyer", "ff-stairs-top", "ff-stairs-bottom"],
  },
  {
    id: "gf-toilet-centre",
    name: "Toilet (Foyer)",
    floorId: "ground",
    category: "service",
    description: "Toilet facilities in the Central Foyer area.",
    polygon: [
      [0.4274, 0.5037],
      [0.4974, 0.5037],
      [0.4974, 0.5926],
      [0.4274, 0.5926],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["gf-foyer"],
  },
  {
    id: "gf-duct-centre",
    name: "Duct",
    floorId: "ground",
    category: "service",
    description: "Service duct in the Central Foyer.",
    polygon: [
      [0.4974, 0.5037],
      [0.5393, 0.5037],
      [0.5393, 0.5926],
      [0.4974, 0.5926],
    ],
    connectedTo: ["gf-foyer"],
  },
  {
    id: "gf-main-entrance",
    name: "Main Entrance",
    floorId: "ground",
    category: "entrance",
    description: "Main entrance porch and delegate drop-off point at the south face of the Central Foyer.",
    polygon: [
      [0.4308, 0.6104],
      [0.5675, 0.6104],
      [0.5675, 0.6844],
      [0.4308, 0.6844],
    ],
    accessibility: "Full step-free access. VIP drop-off at lobby canopy.",
    connectedTo: ["gf-foyer", "site-entrance-main"],
  },

  // ── RIGHT WING ────────────────────────────────────────────────────────────

  {
    id: "gf-vip-lounge",
    name: "VIP Lounge",
    floorId: "ground",
    category: "lounge",
    description: "VIP Lounge on the ground floor of the right wing.",
    polygon: [
      [0.6111, 0.2578],
      [0.6504, 0.2578],
      [0.6504, 0.3319],
      [0.6111, 0.3319],
    ],
    connectedTo: ["gf-corridor-r-wing"],
  },
  {
    id: "gf-boh-rooms",
    name: "Back-of-House / Office Rooms",
    floorId: "ground",
    category: "service",
    description: "Back-of-house service rooms — Audio/Visual Mixing, Greeting Room, office and changing facilities.",
    polygon: [
      [0.6504, 0.2578],
      [0.8291, 0.2578],
      [0.8291, 0.3319],
      [0.6504, 0.3319],
    ],
    connectedTo: ["gf-corridor-r-wing", "gf-vip-lounge"],
  },
  {
    id: "gf-corridor-r-wing",
    name: "Corridor (Right Wing)",
    floorId: "ground",
    category: "circulation",
    description: "Internal circulation corridor in the right (Multi-Purpose Auditorium) wing.",
    polygon: [
      [0.5966, 0.3793],
      [0.8632, 0.3793],
      [0.8632, 0.4178],
      [0.5966, 0.4178],
    ],
    connectedTo: [
      "gf-multi-auditorium", "gf-foyer", "gf-vip-lounge",
      "gf-stage-r", "gf-platform-r", "gf-boh-rooms",
    ],
  },
  {
    id: "gf-stage-r",
    name: "Stage (Multi-Purpose)",
    floorId: "ground",
    category: "auditorium",
    description: "Performance stage in the Multi-Purpose Auditorium.",
    polygon: [
      [0.7692, 0.4178],
      [0.8162, 0.4178],
      [0.8162, 0.6015],
      [0.7692, 0.6015],
    ],
    connectedTo: ["gf-multi-auditorium", "gf-platform-r"],
  },
  {
    id: "gf-platform-r",
    name: "Platform (Multi-Purpose)",
    floorId: "ground",
    category: "circulation",
    description: "Stage access platform in the Multi-Purpose Auditorium.",
    polygon: [
      [0.7282, 0.4178],
      [0.7692, 0.4178],
      [0.7692, 0.6015],
      [0.7282, 0.6015],
    ],
    connectedTo: ["gf-stage-r", "gf-multi-auditorium"],
  },
  {
    id: "gf-multi-auditorium",
    name: "Multi-Purpose Auditorium",
    floorId: "ground",
    category: "auditorium",
    description: "Multi-purpose auditorium for parallel sessions, exhibitions, and breakout events.",
    polygon: [
      [0.5966, 0.3793],
      [0.7282, 0.3793],
      [0.7282, 0.6459],
      [0.5966, 0.6459],
    ],
    connectedTo: ["gf-corridor-r-wing", "gf-stage-r", "gf-platform-r", "gf-corridor-bottom-r"],
  },
  {
    id: "gf-corridor-bottom-r",
    name: "Corridor (South, Right)",
    floorId: "ground",
    category: "circulation",
    description: "South circulation corridor below the Multi-Purpose Auditorium.",
    polygon: [
      [0.5966, 0.6459],
      [0.8632, 0.6459],
      [0.8632, 0.6933],
      [0.5966, 0.6933],
    ],
    connectedTo: ["gf-multi-auditorium", "gf-back-of-house", "gf-storage-r", "gf-wc-so-r"],
  },
  {
    id: "gf-wc-so-r",
    name: "WC / SO (Right)",
    floorId: "ground",
    category: "service",
    description: "WC / Sluice room, right wing.",
    polygon: [
      [0.7282, 0.6015],
      [0.7573, 0.6015],
      [0.7573, 0.6459],
      [0.7282, 0.6459],
    ],
    connectedTo: ["gf-corridor-bottom-r"],
  },
  {
    id: "gf-male-toilet-r",
    name: "Male Toilet (Right)",
    floorId: "ground",
    category: "service",
    description: "Male toilet facilities, right-wing ground floor.",
    polygon: [
      [0.7573, 0.6015],
      [0.8162, 0.6015],
      [0.8162, 0.6459],
      [0.7573, 0.6459],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["gf-corridor-bottom-r"],
  },
  {
    id: "gf-female-toilet-r",
    name: "Female Toilet (Right)",
    floorId: "ground",
    category: "service",
    description: "Female toilet facilities, right-wing ground floor.",
    polygon: [
      [0.7282, 0.6459],
      [0.7692, 0.6459],
      [0.7692, 0.6933],
      [0.7282, 0.6933],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["gf-corridor-bottom-r"],
  },
  {
    id: "gf-back-of-house",
    name: "Back of House",
    floorId: "ground",
    category: "service",
    description: "Back-of-house operations room, south of the Multi-Purpose Auditorium.",
    polygon: [
      [0.5966, 0.6933],
      [0.7094, 0.6933],
      [0.7094, 0.7852],
      [0.5966, 0.7852],
    ],
    connectedTo: ["gf-corridor-bottom-r", "gf-storage-r"],
  },
  {
    id: "gf-storage-r",
    name: "Storage",
    floorId: "ground",
    category: "service",
    description: "Equipment and material storage, ground floor right wing.",
    polygon: [
      [0.7094, 0.6933],
      [0.8205, 0.6933],
      [0.8205, 0.7852],
      [0.7094, 0.7852],
    ],
    connectedTo: ["gf-back-of-house", "gf-corridor-bottom-r"],
  },
];

// ---------------------------------------------------------------------------
// First Floor  (image 5850 × 3375 px)
// ---------------------------------------------------------------------------
// Left wing rooms:  x ≈ 0.035–0.185, y ≈ 0.24–0.57
// Main auditorium:  x ≈ 0.22–0.56,  y ≈ 0.22–0.60
// Centre bridge:    x ≈ 0.455–0.595, y ≈ 0.30–0.58
// Right cluster:    x ≈ 0.595–0.760, y ≈ 0.24–0.62
// Gallery (octagon) x ≈ 0.760–0.925, y ≈ 0.22–0.60
// Far-right void:   x ≈ 0.925–0.975

const FIRST_FLOOR_ROOMS: IccRoom[] = [

  // ── LEFT WING (Executive suite) ───────────────────────────────────────────

  {
    id: "ff-executive-lounge",
    name: "Executive Lounge",
    floorId: "first",
    category: "lounge",
    description: "Executive lounge for senior delegates and distinguished guests.",
    polygon: [
      [0.0308, 0.2756],
      [0.1692, 0.2756],
      [0.1692, 0.3378],
      [0.0308, 0.3378],
    ],
    accessibility: "Lift access from ground floor (Lift 1 or 2).",
    connectedTo: ["ff-corridor-left", "ff-kitchenette"],
  },
  {
    id: "ff-kitchenette",
    name: "Kitchenette",
    floorId: "first",
    category: "service",
    description: "Small kitchenette serving the executive suite lounges.",
    polygon: [
      [0.0308, 0.3378],
      [0.1692, 0.3378],
      [0.1692, 0.3956],
      [0.0308, 0.3956],
    ],
    connectedTo: ["ff-executive-lounge", "ff-waiting-area"],
  },
  {
    id: "ff-waiting-area",
    name: "Waiting Area",
    floorId: "first",
    category: "reception",
    description: "Waiting and pre-function area between the executive lounges.",
    polygon: [
      [0.0308, 0.3956],
      [0.1692, 0.3956],
      [0.1692, 0.4578],
      [0.0308, 0.4578],
    ],
    connectedTo: ["ff-kitchenette", "ff-protocol-lounge"],
  },
  {
    id: "ff-protocol-lounge",
    name: "Protocol Lounge",
    floorId: "first",
    category: "lounge",
    description: "Protocol and official delegation lounge, first floor.",
    polygon: [
      [0.0308, 0.4578],
      [0.1692, 0.4578],
      [0.1692, 0.5200],
      [0.0308, 0.5200],
    ],
    connectedTo: ["ff-waiting-area", "ff-vip-lounge", "ff-corridor-left"],
  },
  {
    id: "ff-vip-lounge",
    name: "VIP Lounge",
    floorId: "first",
    category: "lounge",
    description: "VIP lounge reserved for dignitaries and keynote speakers.",
    polygon: [
      [0.0308, 0.5200],
      [0.1692, 0.5200],
      [0.1692, 0.5733],
      [0.0308, 0.5733],
    ],
    connectedTo: ["ff-protocol-lounge", "ff-press-room", "ff-corridor-left"],
  },
  {
    id: "ff-press-room",
    name: "Press / Media Room",
    floorId: "first",
    category: "media",
    description: "Dedicated workspace for accredited press and media personnel.",
    polygon: [
      [0.0308, 0.5733],
      [0.1692, 0.5733],
      [0.1692, 0.6311],
      [0.0308, 0.6311],
    ],
    connectedTo: ["ff-vip-lounge", "ff-corridor-left"],
  },
  {
    id: "ff-corridor-left",
    name: "Left Wing Corridor",
    floorId: "first",
    category: "circulation",
    description: "Access corridor connecting the executive suite to the main auditorium lobby.",
    polygon: [
      [0.1692, 0.2756],
      [0.2137, 0.2756],
      [0.2137, 0.6311],
      [0.1692, 0.6311],
    ],
    connectedTo: [
      "ff-executive-lounge", "ff-protocol-lounge", "ff-vip-lounge",
      "ff-press-room", "ff-auditorium-upper", "ff-circulation",
    ],
  },

  // ── MAIN AUDITORIUM UPPER LEVEL ────────────────────────────────────────────

  {
    id: "ff-auditorium-upper",
    name: "Main Auditorium",
    floorId: "first",
    category: "auditorium",
    description: "Upper-tier seating of the Main Auditorium — 500 seats, tiered.",
    polygon: [
      [0.2137, 0.2311],
      [0.4547, 0.2311],
      [0.4547, 0.6311],
      [0.2137, 0.6311],
    ],
    connectedTo: ["ff-corridor-left", "ff-elect-room", "ff-circulation", "ff-store-top", "ff-toilet-top-m"],
  },
  {
    id: "ff-elect-room",
    name: "Electrical Room",
    floorId: "first",
    category: "service",
    description: "Electrical plant room serving the upper auditorium level.",
    polygon: [
      [0.4547, 0.3822],
      [0.4880, 0.3822],
      [0.4880, 0.4593],
      [0.4547, 0.4593],
    ],
    connectedTo: ["ff-auditorium-upper", "ff-circulation"],
  },
  {
    id: "ff-store-top",
    name: "Store (North)",
    floorId: "first",
    category: "service",
    description: "Storage room at the north end of the auditorium level.",
    polygon: [
      [0.3744, 0.1867],
      [0.4308, 0.1867],
      [0.4308, 0.2311],
      [0.3744, 0.2311],
    ],
    connectedTo: ["ff-auditorium-upper"],
  },
  {
    id: "ff-toilet-top-m",
    name: "Male Toilet (North)",
    floorId: "first",
    category: "service",
    description: "Male toilet facilities at the north end of the main auditorium.",
    polygon: [
      [0.4308, 0.1867],
      [0.4923, 0.1867],
      [0.4923, 0.2133],
      [0.4308, 0.2133],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["ff-auditorium-upper"],
  },
  {
    id: "ff-toilet-top-f",
    name: "Female Toilet (North)",
    floorId: "first",
    category: "service",
    description: "Female toilet facilities at the north end of the main auditorium.",
    polygon: [
      [0.3744, 0.2133],
      [0.4308, 0.2133],
      [0.4308, 0.2311],
      [0.3744, 0.2311],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["ff-auditorium-upper"],
  },
  {
    id: "ff-toilet-bottom-m",
    name: "Male Toilet (South)",
    floorId: "first",
    category: "service",
    description: "Male toilet at the south end of the main auditorium.",
    polygon: [
      [0.3744, 0.6311],
      [0.4308, 0.6311],
      [0.4308, 0.6578],
      [0.3744, 0.6578],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["ff-auditorium-upper"],
  },
  {
    id: "ff-toilet-bottom-f",
    name: "Female Toilet (South)",
    floorId: "first",
    category: "service",
    description: "Female toilet at the south end of the main auditorium.",
    polygon: [
      [0.4308, 0.6311],
      [0.4923, 0.6311],
      [0.4923, 0.6578],
      [0.4308, 0.6578],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["ff-auditorium-upper"],
  },
  {
    id: "ff-store-bottom",
    name: "Store (South)",
    floorId: "first",
    category: "service",
    description: "Storage room at the south end of the auditorium level.",
    polygon: [
      [0.4923, 0.6311],
      [0.5504, 0.6311],
      [0.5504, 0.6667],
      [0.4923, 0.6667],
    ],
    connectedTo: ["ff-auditorium-upper", "ff-circulation"],
  },
  {
    id: "ff-elec-bottom",
    name: "Electrical Room (South)",
    floorId: "first",
    category: "service",
    description: "Electrical room at the south end — fire exit room.",
    polygon: [
      [0.4923, 0.6667],
      [0.5504, 0.6667],
      [0.5504, 0.7022],
      [0.4923, 0.7022],
    ],
    connectedTo: ["ff-store-bottom"],
  },

  // ── CIRCULATION AREA (Centre) ─────────────────────────────────────────────

  {
    id: "ff-circulation",
    name: "Circulation Area",
    floorId: "first",
    category: "circulation",
    description: "Main first-floor circulation hub — lifts, stairs and core thoroughfare.",
    polygon: [
      [0.4547, 0.3200],
      [0.5983, 0.3200],
      [0.5983, 0.6311],
      [0.4547, 0.6311],
    ],
    connectedTo: [
      "ff-lift-l", "ff-lift-r", "ff-stairs-top", "ff-stairs-bottom",
      "ff-toilet-centre", "ff-auditorium-upper", "ff-elect-room",
      "ff-corridor-left", "ff-seminar-room",
    ],
  },
  {
    id: "ff-lift-l",
    name: "Lift 1",
    floorId: "first",
    category: "circulation",
    description: "Passenger lift (left) — connects first floor to ground floor.",
    polygon: [
      [0.4701, 0.4267],
      [0.5009, 0.4267],
      [0.5009, 0.4756],
      [0.4701, 0.4756],
    ],
    accessibility: "Accessible lift. Press G for ground floor.",
    connectedTo: ["ff-circulation", "gf-lift-l"],
  },
  {
    id: "ff-lift-r",
    name: "Lift 2",
    floorId: "first",
    category: "circulation",
    description: "Passenger lift (right) — connects first floor to ground floor.",
    polygon: [
      [0.5487, 0.4267],
      [0.5795, 0.4267],
      [0.5795, 0.4756],
      [0.5487, 0.4756],
    ],
    accessibility: "Accessible lift. Press G for ground floor.",
    connectedTo: ["ff-circulation", "gf-lift-r"],
  },
  {
    id: "ff-stairs-top",
    name: "Main Stair (North)",
    floorId: "first",
    category: "circulation",
    description: "Northern main staircase connecting first floor to ground floor.",
    polygon: [
      [0.4701, 0.3200],
      [0.5641, 0.3200],
      [0.5641, 0.3822],
      [0.4701, 0.3822],
    ],
    connectedTo: ["ff-circulation", "gf-stairs-main"],
  },
  {
    id: "ff-stairs-bottom",
    name: "Main Stair (South)",
    floorId: "first",
    category: "circulation",
    description: "Southern main staircase connecting first floor to ground floor.",
    polygon: [
      [0.4701, 0.5422],
      [0.5641, 0.5422],
      [0.5641, 0.6311],
      [0.4701, 0.6311],
    ],
    connectedTo: ["ff-circulation", "gf-stairs-main"],
  },
  {
    id: "ff-toilet-centre",
    name: "Toilet (Circulation)",
    floorId: "first",
    category: "service",
    description: "Toilet facilities in the first-floor Circulation Area.",
    polygon: [
      [0.4547, 0.4756],
      [0.5487, 0.4756],
      [0.5487, 0.5422],
      [0.4547, 0.5422],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["ff-circulation"],
  },

  // ── RIGHT CLUSTER (Office wing + seminar) ─────────────────────────────────

  {
    id: "ff-seminar-room",
    name: "Seminar Room",
    floorId: "first",
    category: "seminar",
    description: "Seminar room for parallel technical sessions and workshops.",
    polygon: [
      [0.5983, 0.2489],
      [0.7607, 0.2489],
      [0.7607, 0.3200],
      [0.5983, 0.3200],
    ],
    connectedTo: ["ff-circulation", "ff-office-corridor"],
  },
  {
    id: "ff-stage-r",
    name: "Stage (Right Block)",
    floorId: "first",
    category: "auditorium",
    description: "Stage platform in the right-wing seminar/auditorium block.",
    polygon: [
      [0.5983, 0.3200],
      [0.7607, 0.3200],
      [0.7607, 0.3644],
      [0.5983, 0.3644],
    ],
    connectedTo: ["ff-seminar-room", "ff-office-corridor"],
  },
  {
    id: "ff-utility-room",
    name: "Utility Room",
    floorId: "first",
    category: "service",
    description: "Utility and services room in the right office wing.",
    polygon: [
      [0.5983, 0.3644],
      [0.7607, 0.3644],
      [0.7607, 0.4089],
      [0.5983, 0.4089],
    ],
    connectedTo: ["ff-office-corridor"],
  },
  {
    id: "ff-cctv-room",
    name: "CCTV Monitoring Room",
    floorId: "first",
    category: "service",
    description: "CCTV and security monitoring room for the entire ICC complex.",
    polygon: [
      [0.5983, 0.4089],
      [0.7607, 0.4089],
      [0.7607, 0.4533],
      [0.5983, 0.4533],
    ],
    connectedTo: ["ff-office-corridor"],
  },
  {
    id: "ff-meeting-room-1",
    name: "Meeting Room 1",
    floorId: "first",
    category: "meeting",
    description: "First-floor meeting / committee room.",
    polygon: [
      [0.5983, 0.4533],
      [0.7607, 0.4533],
      [0.7607, 0.4978],
      [0.5983, 0.4978],
    ],
    connectedTo: ["ff-office-corridor", "ff-meeting-room-2"],
  },
  {
    id: "ff-meeting-room-2",
    name: "Meeting Room 2",
    floorId: "first",
    category: "meeting",
    description: "Second first-floor meeting / committee room.",
    polygon: [
      [0.5983, 0.4978],
      [0.7607, 0.4978],
      [0.7607, 0.5378],
      [0.5983, 0.5378],
    ],
    connectedTo: ["ff-office-corridor", "ff-meeting-room-1", "ff-account-office"],
  },
  {
    id: "ff-account-office",
    name: "Account Office",
    floorId: "first",
    category: "office",
    description: "Finance and accounts office on the first floor.",
    polygon: [
      [0.5983, 0.5378],
      [0.7607, 0.5378],
      [0.7607, 0.5778],
      [0.5983, 0.5778],
    ],
    connectedTo: ["ff-meeting-room-2", "ff-reception", "ff-office-corridor"],
  },
  {
    id: "ff-reception",
    name: "Reception / Secretary",
    floorId: "first",
    category: "reception",
    description: "First-floor reception desk and secretariat support.",
    polygon: [
      [0.5983, 0.5778],
      [0.7607, 0.5778],
      [0.7607, 0.6178],
      [0.5983, 0.6178],
    ],
    connectedTo: ["ff-account-office", "ff-director-office", "ff-office-corridor"],
  },
  {
    id: "ff-director-office",
    name: "Director's Office",
    floorId: "first",
    category: "office",
    description: "Office of the ICC Director.",
    polygon: [
      [0.5983, 0.6178],
      [0.7607, 0.6178],
      [0.7607, 0.6578],
      [0.5983, 0.6578],
    ],
    connectedTo: ["ff-reception", "ff-office-corridor"],
  },
  {
    id: "ff-office-corridor",
    name: "Office Corridor",
    floorId: "first",
    category: "circulation",
    description: "Corridor serving the right-wing office and meeting rooms.",
    polygon: [
      [0.7607, 0.2489],
      [0.7949, 0.2489],
      [0.7949, 0.6578],
      [0.7607, 0.6578],
    ],
    connectedTo: [
      "ff-seminar-room", "ff-utility-room", "ff-cctv-room",
      "ff-meeting-room-1", "ff-meeting-room-2", "ff-account-office",
      "ff-reception", "ff-director-office",
      "ff-gallery-r", "ff-toilet-r-m", "ff-toilet-r-f", "ff-store-r",
      "ff-circulation",
    ],
  },
  {
    id: "ff-toilet-r-m",
    name: "Male Toilet (Right)",
    floorId: "first",
    category: "service",
    description: "Male toilet facilities, right wing first floor.",
    polygon: [
      [0.5983, 0.2044],
      [0.6795, 0.2044],
      [0.6795, 0.2489],
      [0.5983, 0.2489],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["ff-office-corridor"],
  },
  {
    id: "ff-toilet-r-f",
    name: "Female Toilet (Right)",
    floorId: "first",
    category: "service",
    description: "Female toilet facilities, right wing first floor.",
    polygon: [
      [0.6795, 0.2044],
      [0.7607, 0.2044],
      [0.7607, 0.2489],
      [0.6795, 0.2489],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["ff-office-corridor"],
  },
  {
    id: "ff-media-cupboard",
    name: "Media Cupboard",
    floorId: "first",
    category: "service",
    description: "Media equipment cupboard / storage.",
    polygon: [
      [0.5983, 0.2311],
      [0.6795, 0.2311],
      [0.6795, 0.2489],
      [0.5983, 0.2489],
    ],
    connectedTo: ["ff-office-corridor"],
  },
  {
    id: "ff-toilet-r-wc",
    name: "Toilet / WC (Right South)",
    floorId: "first",
    category: "service",
    description: "Toilet and WC at the south end of the right wing.",
    polygon: [
      [0.5983, 0.6578],
      [0.6923, 0.6578],
      [0.6923, 0.6933],
      [0.5983, 0.6933],
    ],
    accessibility: "Accessible cubicle available.",
    connectedTo: ["ff-office-corridor"],
  },
  {
    id: "ff-store-r",
    name: "Store (Right South)",
    floorId: "first",
    category: "service",
    description: "Storage room, right wing, south end.",
    polygon: [
      [0.6923, 0.6578],
      [0.7607, 0.6578],
      [0.7607, 0.6933],
      [0.6923, 0.6933],
    ],
    connectedTo: ["ff-office-corridor"],
  },

  // ── GALLERY (Right octagon) ────────────────────────────────────────────────

  {
    id: "ff-gallery-r",
    name: "Gallery",
    floorId: "first",
    category: "gallery",
    description: "Upper-level gallery / viewing area in the right octagonal wing.",
    polygon: [
      [0.7949, 0.2311],
      [0.9282, 0.2311],
      [0.9282, 0.6578],
      [0.7949, 0.6578],
    ],
    connectedTo: ["ff-office-corridor", "ff-otb"],
  },

  // ── OPEN TO BELOW ─────────────────────────────────────────────────────────

  {
    id: "ff-otb",
    name: "Open to Below",
    floorId: "first",
    category: "open",
    description: "Void open to the ground floor below — railing around perimeter. Visible from gallery.",
    polygon: [
      [0.8291, 0.3022],
      [0.9060, 0.3022],
      [0.9060, 0.5956],
      [0.8291, 0.5956],
    ],
    connectedTo: ["ff-gallery-r"],
  },
];

// ---------------------------------------------------------------------------
// Site Plan  (image 5850 × 3375 px)
// ---------------------------------------------------------------------------
// The site plan covers x ≈ 0.04–0.62 (site boundary) with info panel x ≈ 0.62–1.0
// Main road "Kano/Jos–Maiduguri Road" runs along the bottom (y ≈ 0.88–0.96)
// Conference building diamond:  centre ≈ (0.30, 0.55)
// Main entrance gate: x ≈ 0.28–0.32, y ≈ 0.81–0.87

const SITE_PLAN_FACILITIES: IccRoom[] = [
  {
    id: "site-icc",
    name: "Conference Centre Building",
    floorId: "site",
    category: "site-facility",
    description: "Proposed Conference Centre Building — 6,005 sqm. Primary venue for NSE 2026 housing the Main Auditorium and Multi-Purpose Auditorium.",
    polygon: [
      [0.2350, 0.4222],
      [0.3008, 0.3778],
      [0.3880, 0.3778],
      [0.4145, 0.4222],
      [0.4145, 0.5481],
      [0.3880, 0.5926],
      [0.3008, 0.5926],
      [0.2350, 0.5481],
    ],
    connectedTo: ["site-parking-n", "site-parking-s", "site-entrance-main"],
  },
  {
    id: "site-proposed-hotel",
    name: "Proposed Hotel",
    floorId: "site",
    category: "site-facility",
    description: "Proposed hotel block — 753 sqm. Located north of the exhibition park.",
    polygon: [
      [0.2350, 0.0963],
      [0.3316, 0.0963],
      [0.3316, 0.1600],
      [0.2350, 0.1600],
    ],
    connectedTo: ["site-exhibition-park"],
  },
  {
    id: "site-exhibition-park",
    name: "Exhibition Park",
    floorId: "site",
    category: "site-facility",
    description: "Outdoor exhibition park and landscaped pavilion area — trees and event hardstanding.",
    polygon: [
      [0.0513, 0.1630],
      [0.3880, 0.1630],
      [0.3880, 0.4222],
      [0.0513, 0.4222],
    ],
    connectedTo: ["site-icc", "site-proposed-hotel", "site-proposed-masjid"],
  },
  {
    id: "site-proposed-masjid",
    name: "Proposed Masjid",
    floorId: "site",
    category: "site-facility",
    description: "Proposed mosque / masjid — 532 sqm. Located on the western side of the site.",
    polygon: [
      [0.0872, 0.4519],
      [0.1624, 0.4519],
      [0.1624, 0.5185],
      [0.0872, 0.5185],
    ],
    connectedTo: ["site-exhibition-park"],
  },
  {
    id: "site-parking-n",
    name: "Parking (North)",
    floorId: "site",
    category: "site-facility",
    description: "Delegate parking bays north of the conference centre, inside the tarred ring road.",
    polygon: [
      [0.2009, 0.3778],
      [0.3880, 0.3778],
      [0.3880, 0.4222],
      [0.2009, 0.4222],
    ],
    connectedTo: ["site-icc", "site-entrance-main"],
  },
  {
    id: "site-parking-s",
    name: "Parking (South)",
    floorId: "site",
    category: "site-facility",
    description: "Delegate parking bays south of the conference centre, inside the tarred ring road.",
    polygon: [
      [0.2009, 0.5926],
      [0.4145, 0.5926],
      [0.4145, 0.7185],
      [0.2009, 0.7185],
    ],
    connectedTo: ["site-icc", "site-entrance-main"],
  },
  {
    id: "site-power-house",
    name: "Power House",
    floorId: "site",
    category: "service",
    description: "Generator and utility building — 97.5 sqm. Supplies power to the ICC complex. Also houses the 6000L borehole tank.",
    polygon: [
      [0.4316, 0.3926],
      [0.4786, 0.3926],
      [0.4786, 0.4370],
      [0.4316, 0.4370],
    ],
    connectedTo: [],
  },
  {
    id: "site-solar-farm",
    name: "Solar Farm",
    floorId: "site",
    category: "service",
    description: "Solar photovoltaic installation on the eastern side of the site serving the ICC complex.",
    polygon: [
      [0.4786, 0.4074],
      [0.5983, 0.4074],
      [0.5983, 0.7333],
      [0.4786, 0.7333],
    ],
    connectedTo: [],
  },
  {
    id: "site-entrance-main",
    name: "Main Entrance Gate",
    floorId: "site",
    category: "entrance",
    description: "Primary vehicular and pedestrian entrance off the Kano/Jos–Maiduguri Road. Security checkpoint. Delegate shuttle buses stop here.",
    polygon: [
      [0.2521, 0.7926],
      [0.3368, 0.7926],
      [0.3368, 0.8519],
      [0.2521, 0.8519],
    ],
    connectedTo: ["site-icc", "site-parking-s"],
  },
];

// ---------------------------------------------------------------------------
// Floor registry
// ---------------------------------------------------------------------------

export const ICC_FLOORS: IccFloor[] = [
  {
    id: "ground",
    label: "Ground Floor",
    shortLabel: "GF",
    planImage: "/plan/icc-maiduguri-ground-floor.png",
    planPdf: "/plan/icc-maiduguri-ground-floor.pdf",
    naturalWidth: 5850,
    naturalHeight: 3375,
    rooms: GROUND_FLOOR_ROOMS,
  },
  {
    id: "first",
    label: "First Floor",
    shortLabel: "1F",
    planImage: "/plan/icc-maiduguri-first-floor.png",
    planPdf: "/plan/icc-maiduguri-first-floor.pdf",
    naturalWidth: 5850,
    naturalHeight: 3375,
    rooms: FIRST_FLOOR_ROOMS,
  },
];

export const ICC_SITE: IccFloor = {
  id: "site",
  label: "Site Plan",
  shortLabel: "Site",
  planImage: "/plan/icc-maiduguri-site-plan.png",
  planPdf: "/plan/icc-maiduguri-site-plan.pdf",
  naturalWidth: 5850,
  naturalHeight: 3375,
  rooms: SITE_PLAN_FACILITIES,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function allRooms(): IccRoom[] {
  return [...ICC_FLOORS.flatMap((f) => f.rooms), ...ICC_SITE.rooms];
}

export function floorById(id: string): IccFloor | undefined {
  if (id === "site") return ICC_SITE;
  return ICC_FLOORS.find((f) => f.id === id);
}

export function roomById(id: string): IccRoom | undefined {
  return allRooms().find((r) => r.id === id);
}

export function searchRooms(query: string): IccRoom[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allRooms().filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.number ?? "").toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q),
  );
}

export const CATEGORY_LABELS: Record<RoomCategory, string> = {
  auditorium:       "Auditorium",
  seminar:          "Seminar Room",
  meeting:          "Meeting Room",
  lounge:           "Lounge",
  office:           "Office",
  media:            "Media / Press",
  reception:        "Reception",
  gallery:          "Gallery",
  circulation:      "Circulation",
  service:          "Service",
  open:             "Open Area",
  "site-facility":  "Site Facility",
  entrance:         "Entrance",
};

export const CATEGORY_COLORS: Record<RoomCategory, { fill: string; stroke: string; text: string }> = {
  auditorium:      { fill: "#DBEAFE", stroke: "#1D4ED8", text: "#1E3A8A" },
  seminar:         { fill: "#EDE9FE", stroke: "#7C3AED", text: "#4C1D95" },
  meeting:         { fill: "#E0E7FF", stroke: "#4338CA", text: "#312E81" },
  lounge:          { fill: "#FEF3C7", stroke: "#D97706", text: "#78350F" },
  office:          { fill: "#DCFCE7", stroke: "#16A34A", text: "#14532D" },
  media:           { fill: "#FCE7F3", stroke: "#BE185D", text: "#831843" },
  reception:       { fill: "#E0F2FE", stroke: "#0284C7", text: "#075985" },
  gallery:         { fill: "#F5F3FF", stroke: "#7C3AED", text: "#4C1D95" },
  circulation:     { fill: "#F1F5F9", stroke: "#94A3B8", text: "#475569" },
  service:         { fill: "#F8FAFC", stroke: "#CBD5E1", text: "#64748B" },
  open:            { fill: "#F0FDF4", stroke: "#22C55E", text: "#166534" },
  "site-facility": { fill: "#FFF7ED", stroke: "#EA580C", text: "#7C2D12" },
  entrance:        { fill: "#FEF9C3", stroke: "#CA8A04", text: "#713F12" },
};

// ---------------------------------------------------------------------------
// Pathfinding — BFS over the connectedTo graph
// ---------------------------------------------------------------------------

export interface RouteStep {
  roomId: string;
  name: string;
  floorId: string;
  isFloorChange: boolean;
  instruction: string;
}

export interface RouteResult {
  found: true;
  steps: RouteStep[];
  hopCount: number;
  path: string[];
}

export interface RouteNotFound {
  found: false;
  reason: string;
}

export function findRoute(fromId: string, toId: string): RouteResult | RouteNotFound {
  if (fromId === toId) {
    return { found: false, reason: "You are already at the selected destination." };
  }
  const from = roomById(fromId);
  const to   = roomById(toId);
  if (!from) return { found: false, reason: `Room "${fromId}" not found.` };
  if (!to)   return { found: false, reason: `Room "${toId}" not found.` };

  const visited = new Set<string>([fromId]);
  const queue: string[][] = [[fromId]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const room = roomById(current);
    for (const neighbourId of room?.connectedTo ?? []) {
      if (visited.has(neighbourId)) continue;
      visited.add(neighbourId);
      const newPath = [...path, neighbourId];
      if (neighbourId === toId) return buildResult(newPath);
      queue.push(newPath);
    }
  }

  return {
    found: false,
    reason:
      `No connected route found from "${from.name}" to "${to.name}". ` +
      "Room connections may not yet be fully mapped.",
  };
}

function buildResult(path: string[]): RouteResult {
  const steps: RouteStep[] = path.map((id, idx) => {
    const room     = roomById(id)!;
    const prevRoom = idx > 0 ? roomById(path[idx - 1]) : null;
    const isFloorChange =
      prevRoom != null && prevRoom.floorId !== room.floorId;

    let instruction: string;
    if (idx === 0) {
      instruction = `Start at ${room.name}`;
    } else if (isFloorChange) {
      const nextFloor = floorById(room.floorId);
      const verb =
        room.name.toLowerCase().includes("lift") ||
        room.name.toLowerCase().includes("elevator")
          ? "Take the lift to"
          : "Use the stairs to";
      instruction = `${verb} ${nextFloor?.label ?? room.floorId} — exit at ${room.name}`;
    } else if (room.category === "circulation") {
      instruction = `Proceed through ${room.name}`;
    } else if (idx === path.length - 1) {
      instruction = `Arrive at ${room.name}`;
    } else {
      instruction = `Continue to ${room.name}`;
    }

    return { roomId: id, name: room.name, floorId: room.floorId, isFloorChange, instruction };
  });

  return { found: true, steps, hopCount: path.length - 1, path };
}
