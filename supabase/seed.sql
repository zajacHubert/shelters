-- Seed data for local development / CI
-- Run with: supabase db reset  (local)  or  psql $DATABASE_URL -f supabase/seed.sql  (remote)
--
-- Passwords are bcrypt hashes of "password123" (cost 10) — dev only, never production.

-- ---------------------------------------------------------------------------
-- Shelters
-- ---------------------------------------------------------------------------

INSERT INTO shelters (id, name, city, email, password_hash) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Schronisko Warszawa',         'warszawa', 'warszawa@example.com',         '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0/BHdbFEisC'),
  ('22222222-2222-2222-2222-222222222222', 'Przytulisko Mokotow',          'warszawa', 'mokotow@example.com',          '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0/BHdbFEisC'),
  ('33333333-3333-3333-3333-333333333333', 'Dom dla Zwierzat Praga',       'warszawa', 'praga@example.com',            '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0/BHdbFEisC'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Schronisko Krakow',            'krakow',   'krakow@example.com',           '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0/BHdbFEisC'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fundacja Cztery Lapy Krakow',  'krakow',   'cztery-lapy@example.com',      '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0/BHdbFEisC'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Schronisko Trojmiasto',        'gdansk',   'trojmiasto@example.com',       '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0/BHdbFEisC')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Needs — Schronisko Warszawa (all three urgency levels)
-- ---------------------------------------------------------------------------

INSERT INTO needs (shelter_id, name, urgency, quantity, allegro_link) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Karma sucha dla psow',  'pilne',         10, 'https://allegro.pl/oferta/karma-sucha-dla-psow'),
  ('11111111-1111-1111-1111-111111111111', 'Leki weterynaryjne',    'pilne',          3,  NULL),
  ('11111111-1111-1111-1111-111111111111', 'Koce i podkladki',      'potrzebne',     20,  NULL),
  ('11111111-1111-1111-1111-111111111111', 'Karma mokra dla kotow', 'potrzebne',     50, 'https://allegro.pl/oferta/karma-mokra-dla-kotow'),
  ('11111111-1111-1111-1111-111111111111', 'Zabawki dla kotow',     'mile_widziane',  5, 'https://allegro.pl/oferta/zabawki-dla-kotow');

-- ---------------------------------------------------------------------------
-- Needs — Przytulisko Mokotow
-- ---------------------------------------------------------------------------

INSERT INTO needs (shelter_id, name, urgency, quantity, allegro_link) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Karma sucha dla kotow', 'pilne',         15, 'https://allegro.pl/oferta/karma-sucha-dla-kotow'),
  ('22222222-2222-2222-2222-222222222222', 'Smycze i obroze',       'potrzebne',     10,  NULL),
  ('22222222-2222-2222-2222-222222222222', 'Transportery',          'mile_widziane',  2,  NULL);

-- ---------------------------------------------------------------------------
-- Needs — Dom dla Zwierzat Praga
-- ---------------------------------------------------------------------------

INSERT INTO needs (shelter_id, name, urgency, quantity, allegro_link) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Poduszki i legowiska',  'pilne',          8,  NULL),
  ('33333333-3333-3333-3333-333333333333', 'Strzykawki i igly',     'pilne',         20,  NULL),
  ('33333333-3333-3333-3333-333333333333', 'Miska do wody',         'potrzebne',     12, 'https://allegro.pl/oferta/miska-do-wody'),
  ('33333333-3333-3333-3333-333333333333', 'Smycze',                'potrzebne',      6,  NULL),
  ('33333333-3333-3333-3333-333333333333', 'Gryzaki dla psow',      'mile_widziane',  4, 'https://allegro.pl/oferta/gryzaki-dla-psow');

-- ---------------------------------------------------------------------------
-- Needs — Schronisko Krakow
-- ---------------------------------------------------------------------------

INSERT INTO needs (shelter_id, name, urgency, quantity, allegro_link) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Karma sucha mix',       'pilne',         25, 'https://allegro.pl/oferta/karma-sucha-mix'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Leki przeciwpasozytnicze', 'pilne',       8,  NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Reczniki papierowe',    'potrzebne',     30,  NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Klatki transportowe',   'potrzebne',      3, 'https://allegro.pl/oferta/klatki-transportowe'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Miski metalowe',        'mile_widziane', 10,  NULL);

-- ---------------------------------------------------------------------------
-- Needs — Fundacja Cztery Lapy Krakow
-- ---------------------------------------------------------------------------

INSERT INTO needs (shelter_id, name, urgency, quantity, allegro_link) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Worki na odchody',      'pilne',         50,  NULL),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Karma sucha dla psow',  'pilne',         18, 'https://allegro.pl/oferta/karma-sucha-dla-psow'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Szampony dla psow',     'potrzebne',      5, 'https://allegro.pl/oferta/szampon-dla-psow'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Obroze z chipem',       'potrzebne',      7,  NULL),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Zabawki interaktywne',  'mile_widziane',  3, 'https://allegro.pl/oferta/zabawki-interaktywne');

-- ---------------------------------------------------------------------------
-- Needs — Schronisko Trojmiasto
-- ---------------------------------------------------------------------------

INSERT INTO needs (shelter_id, name, urgency, quantity, allegro_link) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Karma sucha dla kotow', 'pilne',         20, 'https://allegro.pl/oferta/karma-sucha-dla-kotow'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bandaze i gaza',        'pilne',         15,  NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Legowiska dla psow',    'potrzebne',      6, 'https://allegro.pl/oferta/legowiska-dla-psow'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Karma mokra dla psow',  'potrzebne',     40, 'https://allegro.pl/oferta/karma-mokra-dla-psow'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Drapaki dla kotow',     'mile_widziane',  2, 'https://allegro.pl/oferta/drapaki-dla-kotow');
