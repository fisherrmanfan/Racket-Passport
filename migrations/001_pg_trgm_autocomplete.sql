-- Enables fuzzy/prefix autocomplete over racket names (GET /autocomplete).
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_racket_rackets_name_trgm
  ON racket_rackets USING gin (name gin_trgm_ops);
