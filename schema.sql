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
