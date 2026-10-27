-- ─────────────────────────────────────────────────────────────────────────────
-- Transport tables migration  (run once in Supabase SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Global transport config (single row, id = 'main')
create table if not exists transport_config (
  id                  text primary key default 'main',
  default_policy      text not null check (default_policy in ('fixed_assignment', 'open_boarding', 'hybrid')),
  policy_descriptions jsonb not null default '{}'::jsonb,
  updated_at          timestamptz not null default now()
);

-- 2. Bus roster
create table if not exists buses (
  id            text primary key,
  name          text not null,
  hotel_id      text not null,
  route_label   text not null,
  capacity      int  not null default 28,
  marshal_name  text not null default 'To be assigned',
  marshal_phone text not null default '+2342013301060',
  pickup_point  text not null,
  updated_at    timestamptz not null default now()
);

-- 3. Daily schedule template
create table if not exists schedule_template (
  id         serial primary key,
  label      text not null,
  direction  text not null check (direction in ('to_venue', 'to_hotel')),
  time       text not null,
  sort_order int  not null default 0,
  updated_at timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table transport_config   enable row level security;
alter table buses              enable row level security;
alter table schedule_template  enable row level security;

-- Authenticated delegates can read everything
create policy "Auth read transport_config"   on transport_config   for select to authenticated using (true);
create policy "Auth read buses"              on buses              for select to authenticated using (true);
create policy "Auth read schedule_template"  on schedule_template  for select to authenticated using (true);

-- ── Seed: config ─────────────────────────────────────────────────────────────
insert into transport_config (id, default_policy, policy_descriptions)
values (
  'main',
  'hybrid',
  '{
    "fixed_assignment": "Every delegate is assigned one bus for the whole conference. Best for headcount and accountability.",
    "open_boarding": "Delegates board any bus going to their hotel. Simpler at the curb but harder to track who is on board.",
    "hybrid": "Delegates have a home bus, but marshals can allow route boarding when needed. Headcount is taken once per run and locked after departure."
  }'::jsonb
)
on conflict (id) do update set
  default_policy      = excluded.default_policy,
  policy_descriptions = excluded.policy_descriptions,
  updated_at          = now();

-- ── Seed: schedule template ───────────────────────────────────────────────────
insert into schedule_template (label, direction, time, sort_order) values
  ('Morning hotel → ICC',   'to_venue',  '07:30', 1),
  ('Mid-morning return',    'to_hotel',  '12:30', 2),
  ('Afternoon hotel → ICC', 'to_venue',  '14:00', 3),
  ('Evening return',        'to_hotel',  '18:30', 4),
  ('Night return',          'to_hotel',  '21:00', 5)
on conflict do nothing;

-- ── Seed: 50 buses ────────────────────────────────────────────────────────────
insert into buses (id, name, hotel_id, route_label, capacity, marshal_name, marshal_phone, pickup_point) values
  ('bus-1',  'Bus 1',  'solce',              'ICC ↔ Solace Suites & Homes',               28, 'Engr. Musa Ibrahim',         '+2348033102009', 'ICC main entrance - Bay A'),
  ('bus-2',  'Bus 2',  'golden-sand',        'ICC ↔ Golden Sand Hotels',                  30, 'Engr. Tanko Gyang',          '+2348038924133', 'ICC main entrance - Bay B'),
  ('bus-3',  'Bus 3',  'grand-polo',         'ICC ↔ Grand Polo Hotel',                    35, 'Engr. Ibrahim Dederi',       '+2348068896400', 'ICC main entrance - Bay C'),
  ('bus-4',  'Bus 4',  'grand-pinnacle',     'ICC ↔ Grand Pinnacle Luxury Hotel',         25, 'Engr. Raheem Jimoh',         '+2347030509184', 'ICC main entrance - Bay D'),
  ('bus-5',  'Bus 5',  'city-star',          'ICC ↔ City Star Hotel',                     28, 'Engr. Magdalene Demesi',     '+2348097400003', 'ICC main entrance - Bay E'),
  ('bus-6',  'Bus 6',  'amada',              'ICC ↔ Amada International Hotel',           30, 'Engr. Ezekwesili Onah',      '+2348164665927', 'ICC main entrance - Bay F'),
  ('bus-7',  'Bus 7',  'borno-state-hotel',  'ICC ↔ Borno State Hotel',                   35, 'Engr. Sharafadeen Olumoh',   '+2349132306750', 'ICC main entrance - Bay G'),
  ('bus-8',  'Bus 8',  'kelrich-hotel',      'ICC ↔ Kelrich Hotel Ltd',                   25, 'Engr. Vandeyon Tertsea',     '+2348167261763', 'ICC main entrance - Bay H'),
  ('bus-9',  'Bus 9',  'rb-hotel',           'ICC ↔ RB Hotel and Suites',                 28, 'Engr. CP Kachi',             '+2347033102009', 'ICC main entrance - Bay I'),
  ('bus-10', 'Bus 10', 'zairan',             'ICC ↔ Zairan Hotel',                        30, 'Engr. Ademola Agoro',        '+2348065119443', 'ICC main entrance - Bay J'),
  ('bus-11', 'Bus 11', 'nanne-and-boi',      'ICC ↔ Nanne and Boi Suites',                35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay E / hotel lobby bus stop'),
  ('bus-12', 'Bus 12', 'aiba-sport-resort',  'ICC ↔ Aiba Sport Resort',                   25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay F / hotel lobby bus stop'),
  ('bus-13', 'Bus 13', 'barwee',             'ICC ↔ Barwee Luxury Suites',                28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay A / hotel lobby bus stop'),
  ('bus-14', 'Bus 14', 'dujima',             'ICC ↔ Dujima International Hotel',          30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay B / hotel lobby bus stop'),
  ('bus-15', 'Bus 15', 'desert-view',        'ICC ↔ Desert View Suites',                  35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay C / hotel lobby bus stop'),
  ('bus-16', 'Bus 16', 'djado',              'ICC ↔ D''jado Hotel',                       25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay D / hotel lobby bus stop'),
  ('bus-17', 'Bus 17', 'khanan-hotel',       'ICC ↔ Khanan Hotel',                        28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay E / hotel lobby bus stop'),
  ('bus-18', 'Bus 18', 'muna',               'ICC ↔ Muna Hotels Limited',                 30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay F / hotel lobby bus stop'),
  ('bus-19', 'Bus 19', 'command-guest-inn',  'ICC ↔ Command Guesthouse Maiduguri',        35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay A / hotel lobby bus stop'),
  ('bus-20', 'Bus 20', 'bajele-hotels',      'ICC ↔ Bajele Hotels and Apartments',        25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay B / hotel lobby bus stop'),
  ('bus-21', 'Bus 21', 'galaxy-hotel',       'ICC ↔ Galaxy Guest Palace Maiduguri',       28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay C / hotel lobby bus stop'),
  ('bus-22', 'Bus 22', 'glopet-hotel',       'ICC ↔ Glopet Resorts Hotel & Event Center', 30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay D / hotel lobby bus stop'),
  ('bus-23', 'Bus 23', 'unimaid-guest-inn',  'ICC ↔ UNIMAID Guest House',                 35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay E / hotel lobby bus stop'),
  ('bus-24', 'Bus 24', 'yerwa-guest-inn',    'ICC ↔ Yerwa Guest Inn',                     25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay F / hotel lobby bus stop'),
  ('bus-25', 'Bus 25', 'sahel-hotel',        'ICC ↔ Sahel Hotel',                         28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay A / hotel lobby bus stop'),
  ('bus-26', 'Bus 26', 'lale-guest-house',   'ICC ↔ Lale Guest House',                    30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay B / hotel lobby bus stop'),
  ('bus-27', 'Bus 27', 'prime-lodge',        'ICC ↔ Prime Lodge',                         35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay C / hotel lobby bus stop'),
  ('bus-28', 'Bus 28', 'bamus-suites',       'ICC ↔ Bamus Suites and Apartments',         25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay D / hotel lobby bus stop'),
  ('bus-29', 'Bus 29', 'imperial-hotel',     'ICC ↔ Imperial Hotel',                      28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay E / hotel lobby bus stop'),
  ('bus-30', 'Bus 30', 'house-174',          'ICC ↔ House 174',                           30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay F / hotel lobby bus stop'),
  ('bus-31', 'Bus 31', 'jemdove-homes',      'ICC ↔ Jemdove Homes and Apartments',        35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay A / hotel lobby bus stop'),
  ('bus-32', 'Bus 32', 'cityden-apartments', 'ICC ↔ Cityden Apartments',                  25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay B / hotel lobby bus stop'),
  ('bus-33', 'Bus 33', 'lake-chad-hotel',    'ICC ↔ Lake Chad Hotel',                     28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay C / hotel lobby bus stop'),
  ('bus-34', 'Bus 34', 'rahama-lodge',       'ICC ↔ Rahama Lodge',                        30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay D / hotel lobby bus stop'),
  ('bus-35', 'Bus 35', 'umth-guest-house',   'ICC ↔ UMTH Guest House',                    35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay E / hotel lobby bus stop'),
  ('bus-36', 'Bus 36', 'starlight-peace',    'ICC ↔ Starlight Peace & Luxury Hotel',      25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay F / hotel lobby bus stop'),
  ('bus-37', 'Bus 37', 'haske-guest-inn',    'ICC ↔ Haske Guest Inn',                     28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay A / hotel lobby bus stop'),
  ('bus-38', 'Bus 38', 'travel-heaven',      'ICC ↔ Travel Heaven',                       30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay B / hotel lobby bus stop'),
  ('bus-39', 'Bus 39', 'peace-lodge',        'ICC ↔ Peace Lodge',                         35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay C / hotel lobby bus stop'),
  ('bus-40', 'Bus 40', 'ali-chairman',       'ICC ↔ Ali Chairman Guest Inn',              25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay D / hotel lobby bus stop'),
  ('bus-41', 'Bus 41', 'horizontal-inn',     'ICC ↔ Horizontal Guest Inn',                28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay E / hotel lobby bus stop'),
  ('bus-42', 'Bus 42', 'tourist-hotel',      'ICC ↔ Tourist Hotel',                       30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay F / hotel lobby bus stop'),
  ('bus-43', 'Bus 43', 'mara-zaine',         'ICC ↔ Mara Zaine',                          35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay A / hotel lobby bus stop'),
  ('bus-44', 'Bus 44', 'solce',              'ICC ↔ Solace Suites & Homes',               25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay B / hotel lobby bus stop'),
  ('bus-45', 'Bus 45', 'golden-sand',        'ICC ↔ Golden Sand Hotels',                  28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay C / hotel lobby bus stop'),
  ('bus-46', 'Bus 46', 'grand-polo',         'ICC ↔ Grand Polo Hotel',                    30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay D / hotel lobby bus stop'),
  ('bus-47', 'Bus 47', 'grand-pinnacle',     'ICC ↔ Grand Pinnacle Luxury Hotel',         35, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay E / hotel lobby bus stop'),
  ('bus-48', 'Bus 48', 'city-star',          'ICC ↔ City Star Hotel',                     25, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay F / hotel lobby bus stop'),
  ('bus-49', 'Bus 49', 'amada',              'ICC ↔ Amada International Hotel',           28, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay A / hotel lobby bus stop'),
  ('bus-50', 'Bus 50', 'borno-state-hotel',  'ICC ↔ Borno State Hotel',                   30, 'To be assigned',             '+2342013301060', 'ICC main entrance – Bay B / hotel lobby bus stop')
on conflict (id) do update set
  name          = excluded.name,
  hotel_id      = excluded.hotel_id,
  route_label   = excluded.route_label,
  capacity      = excluded.capacity,
  marshal_name  = excluded.marshal_name,
  marshal_phone = excluded.marshal_phone,
  pickup_point  = excluded.pickup_point,
  updated_at    = now();
