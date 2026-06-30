import fs from 'node:fs';
import path from 'node:path';

import BetterSqlite3 from 'better-sqlite3';
import type { Database } from 'better-sqlite3';

export type DatabaseOptions = {
  dbPath?: string;
};

const defaultDbPath = path.resolve(process.cwd(), 'server/data/de-butler.sqlite');

export function resolveDatabasePath(dbPath = process.env.DATABASE_PATH): string {
  return path.resolve(dbPath || defaultDbPath);
}

export function createDatabase(options: DatabaseOptions = {}): Database {
  const dbPath = resolveDatabasePath(options.dbPath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const database = new BetterSqlite3(dbPath);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'WHAT DOES',
      date TEXT NOT NULL,
      description TEXT,
      location TEXT,
      image_url TEXT,
      link_url TEXT,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      date TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activities_sort_order ON activities(sort_order);
    CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
  `);

  const eventColumns = database.prepare("PRAGMA table_info(events)").all() as Array<{ name: string }>;
  const eventColumnNames = new Set(eventColumns.map((column) => column.name));
  if (!eventColumnNames.has('category')) {
    database.exec("ALTER TABLE events ADD COLUMN category TEXT NOT NULL DEFAULT 'WHAT DOES'");
  }
  if (!eventColumnNames.has('link_url')) {
    database.exec('ALTER TABLE events ADD COLUMN link_url TEXT');
  }
  if (!eventColumnNames.has('done')) {
    database.exec('ALTER TABLE events ADD COLUMN done INTEGER NOT NULL DEFAULT 0');
  }

  database.exec(`
    UPDATE activities
    SET category = 'Session'
    WHERE category IS NULL OR category = '' OR category = 'Activity'
  `);

  return database;
}
