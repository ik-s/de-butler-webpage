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
  const hadHackathonsTable = Boolean(
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'hackathons'")
      .get(),
  );

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

    CREATE TABLE IF NOT EXISTS hackathons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      title TEXT NOT NULL,
      meta TEXT NOT NULL,
      image_url TEXT,
      image_fit TEXT NOT NULL DEFAULT 'cover',
      description TEXT NOT NULL,
      link_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_hackathons_sort_order ON hackathons(sort_order);
  `);

  if (!hadHackathonsTable) {
    const insertHackathon = database.prepare(`
      INSERT INTO hackathons (label, title, meta, image_url, image_fit, description, link_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertHackathon.run(
      'Hackathon Archive',
      'DE-BUTHON 2025',
      '2025.03 - Kwangwoon University',
      '/hackathon/de-buthon-2025.webp',
      'cover',
      '디버틀러에서 개최한 첫 해커톤입니다. 아이디어톤과 프로덕트톤을 동시에 운영하고 Axelar · Biconomy 등 파트너사들이 Special Track을 개설해 다채로운 빌딩의 장을 만들었습니다.',
      'https://www.hankyung.com/article/202503244674O',
      10,
    );
    insertHackathon.run(
      'Upcoming Hackathon',
      '2026 Hackathon',
      'Coming Soon',
      '/hackathon/de-buthon-2026.png',
      'contain',
      'Coming Soon',
      null,
      20,
    );
  }

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
