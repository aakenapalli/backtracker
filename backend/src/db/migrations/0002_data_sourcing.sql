ALTER TABLE sites
  ADD COLUMN wikidata_qid        TEXT UNIQUE CHECK (wikidata_qid ~ '^Q[1-9][0-9]*$'),
  ADD COLUMN wikipedia_title     TEXT,
  ADD COLUMN source_license      TEXT CHECK (source_license IN ('CC0-1.0', 'CC-BY-SA-4.0')),
  ADD COLUMN source_retrieved_at TIMESTAMPTZ,
  ADD COLUMN interest_score      DOUBLE PRECISION CHECK (interest_score BETWEEN 0 AND 1),
  ADD COLUMN trend_score         DOUBLE PRECISION CHECK (trend_score BETWEEN -1 AND 1),
  ADD COLUMN social_score        DOUBLE PRECISION CHECK (social_score BETWEEN 0 AND 1);

-- Dense monthly time series per site per Wikipedia language edition. Language
-- is part of the key (not a separate table per language) because the two
-- series are compared and combined at read time, not queried independently.
CREATE TABLE site_pageview_months (
  site_slug TEXT NOT NULL REFERENCES sites(slug) ON DELETE CASCADE,
  language  TEXT NOT NULL CHECK (language IN ('en', 'tr')),
  month     DATE NOT NULL CHECK (EXTRACT(DAY FROM month) = 1),
  views     INTEGER NOT NULL CHECK (views >= 0),
  PRIMARY KEY (site_slug, language, month)
);

-- Sparse rolling-window aggregates. Deliberately a separate table from
-- pageviews (not a generic (source, metric, value) signals table): the two
-- have genuinely different shapes -- a dense monthly series vs. a
-- point-in-time snapshot over a window -- and this keeps CHECK constraints
-- and typed columns on both, matching 0001_init.sql's philosophy.
CREATE TABLE site_social_snapshots (
  site_slug     TEXT NOT NULL REFERENCES sites(slug) ON DELETE CASCADE,
  source        TEXT NOT NULL CHECK (source IN ('stackexchange', 'reddit')),
  captured_on   DATE NOT NULL,
  window_days   INTEGER NOT NULL CHECK (window_days > 0),
  post_count    INTEGER NOT NULL CHECK (post_count >= 0),
  comment_count INTEGER NOT NULL CHECK (comment_count >= 0),
  score_sum     INTEGER NOT NULL,
  top_item_url  TEXT,
  PRIMARY KEY (site_slug, source, captured_on)
);
