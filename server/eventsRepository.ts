import type { Database } from 'better-sqlite3';

import type { CreateEventInput, EventRecord, UpdateEventInput } from './eventTypes.ts';

type EventRow = {
  id: number;
  title: string;
  category: EventRecord['category'];
  date: string;
  description: string | null;
  link_url: string | null;
  created_at: string;
  updated_at: string;
};

const eventColumns = `
  id,
  title,
  category,
  date,
  description,
  link_url,
  created_at,
  updated_at
`;

function toEventRecord(row: EventRow): EventRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: row.date,
    description: row.description,
    linkUrl: row.link_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class EventsRepository {
  constructor(private readonly database: Database) {}

  list(): EventRecord[] {
    const rows = this.database
      .prepare(`SELECT ${eventColumns} FROM events ORDER BY date DESC, id DESC`)
      .all() as EventRow[];

    return rows.map(toEventRecord);
  }

  findById(id: number): EventRecord | null {
    const row = this.database
      .prepare<[number]>(`SELECT ${eventColumns} FROM events WHERE id = ?`)
      .get(id) as EventRow | undefined;

    return row ? toEventRecord(row) : null;
  }

  create(input: CreateEventInput): EventRecord {
    const result = this.database
      .prepare<[string, string, string, string | null, string | null]>(`
        INSERT INTO events (title, category, date, description, link_url)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        input.title.trim(),
        input.category || 'WHAT DOES',
        input.date.trim(),
        normalizeOptionalText(input.description),
        normalizeOptionalText(input.linkUrl),
      );

    return this.findById(Number(result.lastInsertRowid)) as EventRecord;
  }

  update(id: number, input: UpdateEventInput): EventRecord | null {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const next = {
      title: input.title === undefined ? existing.title : input.title.trim(),
      category: input.category === undefined ? existing.category : input.category,
      date: input.date === undefined ? existing.date : input.date.trim(),
      description:
        input.description === undefined ? existing.description : normalizeOptionalText(input.description),
      linkUrl: input.linkUrl === undefined ? existing.linkUrl : normalizeOptionalText(input.linkUrl),
    };

    this.database
      .prepare<[string, string, string, string | null, string | null, number]>(`
        UPDATE events
        SET
          title = ?,
          category = ?,
          date = ?,
          description = ?,
          link_url = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(next.title, next.category, next.date, next.description, next.linkUrl, id);

    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.database.prepare<[number]>('DELETE FROM events WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
