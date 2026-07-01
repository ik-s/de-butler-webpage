import type { Database } from 'better-sqlite3';

import type {
  CreateHackathonInput,
  HackathonImageFit,
  HackathonRecord,
  UpdateHackathonInput,
} from './hackathonTypes.ts';

type HackathonRow = {
  id: number;
  label: string;
  title: string;
  meta: string;
  image_url: string | null;
  image_fit: HackathonImageFit;
  description: string;
  link_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const hackathonColumns = `
  id,
  label,
  title,
  meta,
  image_url,
  image_fit,
  description,
  link_url,
  sort_order,
  created_at,
  updated_at
`;

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toHackathonRecord(row: HackathonRow): HackathonRecord {
  return {
    id: row.id,
    label: row.label,
    title: row.title,
    meta: row.meta,
    imageUrl: row.image_url,
    imageFit: row.image_fit,
    description: row.description,
    linkUrl: row.link_url,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class HackathonsRepository {
  constructor(private readonly database: Database) {}

  list(): HackathonRecord[] {
    const rows = this.database
      .prepare(`SELECT ${hackathonColumns} FROM hackathons ORDER BY sort_order ASC, id ASC`)
      .all() as HackathonRow[];

    return rows.map(toHackathonRecord);
  }

  findById(id: number): HackathonRecord | null {
    const row = this.database
      .prepare<[number]>(`SELECT ${hackathonColumns} FROM hackathons WHERE id = ?`)
      .get(id) as HackathonRow | undefined;

    return row ? toHackathonRecord(row) : null;
  }

  create(input: CreateHackathonInput): HackathonRecord {
    const result = this.database
      .prepare<[string, string, string, string | null, HackathonImageFit, string, string | null, number]>(`
        INSERT INTO hackathons (label, title, meta, image_url, image_fit, description, link_url, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.label.trim(),
        input.title.trim(),
        input.meta.trim(),
        normalizeOptionalText(input.imageUrl),
        input.imageFit || 'cover',
        input.description.trim(),
        normalizeOptionalText(input.linkUrl),
        input.sortOrder ?? 0,
      );

    return this.findById(Number(result.lastInsertRowid)) as HackathonRecord;
  }

  update(id: number, input: UpdateHackathonInput): HackathonRecord | null {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const next = {
      label: input.label === undefined ? existing.label : input.label.trim(),
      title: input.title === undefined ? existing.title : input.title.trim(),
      meta: input.meta === undefined ? existing.meta : input.meta.trim(),
      imageUrl: input.imageUrl === undefined ? existing.imageUrl : normalizeOptionalText(input.imageUrl),
      imageFit: input.imageFit === undefined ? existing.imageFit : input.imageFit,
      description: input.description === undefined ? existing.description : input.description.trim(),
      linkUrl: input.linkUrl === undefined ? existing.linkUrl : normalizeOptionalText(input.linkUrl),
      sortOrder: input.sortOrder === undefined ? existing.sortOrder : input.sortOrder,
    };

    this.database
      .prepare<[string, string, string, string | null, HackathonImageFit, string, string | null, number, number]>(`
        UPDATE hackathons
        SET
          label = ?,
          title = ?,
          meta = ?,
          image_url = ?,
          image_fit = ?,
          description = ?,
          link_url = ?,
          sort_order = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(
        next.label,
        next.title,
        next.meta,
        next.imageUrl,
        next.imageFit,
        next.description,
        next.linkUrl,
        next.sortOrder,
        id,
      );

    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.database.prepare<[number]>('DELETE FROM hackathons WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
