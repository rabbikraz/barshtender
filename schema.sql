DROP TABLE IF EXISTS quotes;
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  service_type TEXT,
  event_type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  event_date TEXT,
  guest_count INTEGER,
  location TEXT,
  message TEXT,
  created_at TEXT,
  status TEXT DEFAULT 'new'
);

-- Personalized menu-builder links (endpoints also create this on demand,
-- so existing databases need no manual migration)
CREATE TABLE IF NOT EXISTS menu_links (
  token TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL,
  created_at TEXT,
  submitted_at TEXT,
  selection TEXT
);
