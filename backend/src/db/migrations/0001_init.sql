CREATE TABLE themes (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE sites (
  slug                      TEXT PRIMARY KEY,
  name                      TEXT NOT NULL,
  city                      TEXT NOT NULL CHECK (city IN ('istanbul')),
  neighborhood              TEXT NOT NULL,
  latitude                  DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude                 DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  short_description         TEXT NOT NULL,
  historical_significance   TEXT NOT NULL,
  estimated_visit_minutes   INTEGER NOT NULL CHECK (estimated_visit_minutes > 0),
  typical_wait_minutes      INTEGER NOT NULL CHECK (typical_wait_minutes >= 0),
  cost_category             TEXT NOT NULL CHECK (cost_category IN ('free','low','medium','high')),
  advance_ticket_required   BOOLEAN NOT NULL,
  must_book_ahead           BOOLEAN NOT NULL,
  recommended_booking_notes TEXT,
  opening_hours_note        TEXT,
  closed_days_note          TEXT,
  indoor_outdoor            TEXT NOT NULL CHECK (indoor_outdoor IN ('indoor','outdoor','mixed')),
  pace_intensity            TEXT NOT NULL CHECK (pace_intensity IN ('low','medium','high')),
  familiarity_level_hint    TEXT NOT NULL CHECK (familiarity_level_hint IN ('beginner','all','enthusiast')),
  editorial_priority        SMALLINT NOT NULL CHECK (editorial_priority BETWEEN 1 AND 5),
  source_url                TEXT,
  source_attribution        TEXT
);

CREATE INDEX sites_city_idx ON sites (city);

CREATE TABLE site_themes (
  site_slug  TEXT NOT NULL REFERENCES sites(slug)  ON DELETE CASCADE,
  theme_slug TEXT NOT NULL REFERENCES themes(slug) ON DELETE RESTRICT,
  weight     DOUBLE PRECISION NOT NULL CHECK (weight > 0 AND weight <= 1),
  PRIMARY KEY (site_slug, theme_slug)
);

CREATE INDEX site_themes_theme_slug_idx ON site_themes (theme_slug);

CREATE TABLE site_relationships (
  from_slug         TEXT NOT NULL REFERENCES sites(slug) ON DELETE CASCADE,
  to_slug           TEXT NOT NULL REFERENCES sites(slug) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN
                      ('nearby','same-era','same-theme','paired-visit','contrast-over-time')),
  strength          DOUBLE PRECISION NOT NULL CHECK (strength > 0 AND strength <= 1),
  notes             TEXT,
  PRIMARY KEY (from_slug, to_slug, relationship_type),
  CHECK (from_slug <> to_slug)
);

CREATE INDEX site_relationships_to_slug_idx ON site_relationships (to_slug);
