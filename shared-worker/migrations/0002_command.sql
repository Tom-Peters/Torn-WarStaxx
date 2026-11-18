-- The v1 table and its revision sequence remain independent.
CREATE TABLE IF NOT EXISTS war_command (
  faction INTEGER NOT NULL, war INTEGER NOT NULL, revision INTEGER NOT NULL,
  plan TEXT NOT NULL, operations TEXT NOT NULL, updated INTEGER NOT NULL,
  event TEXT NOT NULL, next_cleanup INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(faction,war)
);
CREATE INDEX IF NOT EXISTS command_cleanup ON war_command(next_cleanup);
CREATE TABLE IF NOT EXISTS war_command_event (
  faction INTEGER NOT NULL, war INTEGER NOT NULL, revision INTEGER NOT NULL,
  at INTEGER NOT NULL, event TEXT NOT NULL, PRIMARY KEY(faction,war,revision)
);
CREATE INDEX IF NOT EXISTS command_event_age ON war_command_event(at);
CREATE TRIGGER IF NOT EXISTS command_created AFTER INSERT ON war_command BEGIN
  INSERT INTO war_command_event VALUES(NEW.faction,NEW.war,NEW.revision,NEW.updated,NEW.event);
END;
CREATE TRIGGER IF NOT EXISTS command_updated AFTER UPDATE OF revision ON war_command BEGIN
  INSERT INTO war_command_event VALUES(NEW.faction,NEW.war,NEW.revision,NEW.updated,NEW.event);
  DELETE FROM war_command_event WHERE faction=NEW.faction AND war=NEW.war AND revision<=NEW.revision-300;
END;
