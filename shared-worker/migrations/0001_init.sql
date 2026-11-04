CREATE TABLE IF NOT EXISTS faction_orders (
  faction_id INTEGER NOT NULL,
  war_id INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (faction_id, war_id)
);
