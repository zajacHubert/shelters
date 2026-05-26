-- Urgency enum
CREATE TYPE urgency_level AS ENUM ('pilne', 'potrzebne', 'mile_widziane');

-- Shelters table
CREATE TABLE shelters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shelters_city ON shelters(city);

-- Needs table
CREATE TABLE needs (
  id SERIAL PRIMARY KEY,
  shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  urgency urgency_level NOT NULL,
  quantity INTEGER NOT NULL,
  allegro_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_needs_shelter_id ON needs(shelter_id);
