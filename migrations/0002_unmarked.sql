-- Unmarked Grave: Muse-generated tributes, cached by slug so each name is generated once.
CREATE TABLE IF NOT EXISTS unmarked_cache (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  created INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS unmarked_daily (
  day TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0,
  ok INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0
);
