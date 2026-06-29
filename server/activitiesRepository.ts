import type { Database } from 'better-sqlite3';

import type { ActivityRecord, CreateActivityInput, UpdateActivityInput } from './activityTypes.ts';

type ActivityRow = {
  id: number;
  title: string;
  category: string | null;
  date: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const activityColumns = `
  id,
  title,
  category,
  date,
  description,
  image_url,
  sort_order,
  created_at,
  updated_at
`;

function toActivityRecord(row: ActivityRow): ActivityRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: row.date,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
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

function normalizeSortOrder(value: number | undefined): number {
  return Number.isInteger(value) ? value : 0;
}

export class ActivitiesRepository {
  constructor(private readonly database: Database) {}

  list(): ActivityRecord[] {
    const rows = this.database
      .prepare(`SELECT ${activityColumns} FROM activities ORDER BY date DESC, id DESC`)
      .all() as ActivityRow[];

    return rows.map(toActivityRecord);
  }

  findById(id: number): ActivityRecord | null {
    const row = this.database
      .prepare<[number]>(`SELECT ${activityColumns} FROM activities WHERE id = ?`)
      .get(id) as ActivityRow | undefined;

    return row ? toActivityRecord(row) : null;
  }

  create(input: CreateActivityInput): ActivityRecord {
    const result = this.database
      .prepare<[string, string | null, string, string | null, string | null, number]>(`
        INSERT INTO activities (title, category, date, description, image_url, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.title.trim(),
        normalizeOptionalText(input.category),
        input.date.trim(),
        normalizeOptionalText(input.description),
        normalizeOptionalText(input.imageUrl),
        normalizeSortOrder(input.sortOrder),
      );

    return this.findById(Number(result.lastInsertRowid)) as ActivityRecord;
  }

  update(id: number, input: UpdateActivityInput): ActivityRecord | null {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const next = {
      title: input.title === undefined ? existing.title : input.title.trim(),
      category: input.category === undefined ? existing.category : normalizeOptionalText(input.category),
      date: input.date === undefined ? existing.date : input.date.trim(),
      description:
        input.description === undefined ? existing.description : normalizeOptionalText(input.description),
      imageUrl: input.imageUrl === undefined ? existing.imageUrl : normalizeOptionalText(input.imageUrl),
      sortOrder: input.sortOrder === undefined ? existing.sortOrder : normalizeSortOrder(input.sortOrder),
    };

    this.database
      .prepare<[string, string | null, string, string | null, string | null, number, number]>(`
        UPDATE activities
        SET
          title = ?,
          category = ?,
          date = ?,
          description = ?,
          image_url = ?,
          sort_order = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(next.title, next.category, next.date, next.description, next.imageUrl, next.sortOrder, id);

    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.database.prepare<[number]>('DELETE FROM activities WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
