CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY NOT NULL,
  building TEXT NOT NULL,
  floor INTEGER,
  room TEXT NOT NULL,
  category TEXT NOT NULL,
  rating INTEGER,
  defect_notes TEXT NOT NULL DEFAULT '',
  photo TEXT,
  latitude REAL,
  longitude REAL,
  timestamp TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_attempts INTEGER NOT NULL DEFAULT 0,
  last_sync_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_inspections_timestamp ON inspections (timestamp DESC);
