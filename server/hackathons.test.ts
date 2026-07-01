import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';

import { createApp } from './app.ts';
import { createDatabase } from './db.ts';
import { HackathonsRepository } from './hackathonsRepository.ts';

type JsonValue = Record<string, unknown> | unknown[];

async function request<T extends JsonValue | undefined>(
  baseUrl: string,
  pathname: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  });

  const text = await response.text();
  return {
    status: response.status,
    body: (text ? JSON.parse(text) : undefined) as T,
  };
}

async function loginAdmin(baseUrl: string): Promise<string> {
  const login = await request<Record<string, unknown>>(baseUrl, '/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'De-Butler', password: 'debutlerzzang' }),
  });

  assert.equal(login.status, 200);
  return String(login.body.token);
}

describe('hackathons API', () => {
  let tempDir = '';
  let app: Express;
  let server: Server;
  let baseUrl = '';

  before(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'de-butler-hackathons-'));
    app = createApp({ dbPath: path.join(tempDir, 'hackathons.sqlite') });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();
    assert.equal(typeof address, 'object');
    assert(address);
    baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    app.locals.database.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  test('lists one-time seeded hackathon cards', async () => {
    const list = await request<Record<string, unknown>[]>(baseUrl, '/api/hackathons');

    assert.equal(list.status, 200);
    assert.deepEqual(list.body.map((card) => card.title), ['DE-BUTHON 2025', '2026 Hackathon']);
    assert.equal(list.body[0].linkUrl, 'https://www.hankyung.com/article/202503244674O');
    assert.equal(list.body[1].imageUrl, '/hackathon/de-buthon-2026.png');
    assert.equal(list.body[1].imageFit, 'contain');
  });

  test('creates, updates, reads, and deletes a hackathon card with admin token', async () => {
    const token = await loginAdmin(baseUrl);

    const created = await request<Record<string, unknown>>(baseUrl, '/api/hackathons', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        label: 'New Hackathon',
        title: 'Builder Sprint',
        meta: '2026.08',
        imageUrl: '/hackathon/sprint.png',
        imageFit: 'contain',
        description: 'Sprint description',
        linkUrl: 'https://example.com/sprint',
        sortOrder: 30,
      }),
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.title, 'Builder Sprint');
    assert.equal(created.body.imageFit, 'contain');

    const id = Number(created.body.id);
    const updated = await request<Record<string, unknown>>(baseUrl, `/api/hackathons/${id}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Builder Sprint Updated',
        imageFit: 'cover',
        linkUrl: null,
      }),
    });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.title, 'Builder Sprint Updated');
    assert.equal(updated.body.imageFit, 'cover');
    assert.equal(updated.body.linkUrl, null);

    const read = await request<Record<string, unknown>>(baseUrl, `/api/hackathons/${id}`);
    assert.equal(read.status, 200);
    assert.equal(read.body.title, 'Builder Sprint Updated');

    const deleted = await request<undefined>(baseUrl, `/api/hackathons/${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(deleted.status, 204);

    const missing = await request<Record<string, unknown>>(baseUrl, `/api/hackathons/${id}`);
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error, 'Hackathon not found');
  });

  test('requires admin token for hackathon mutations', async () => {
    const createResult = await request<Record<string, unknown>>(baseUrl, '/api/hackathons', {
      method: 'POST',
      body: JSON.stringify({ title: 'Unauthorized' }),
    });
    assert.equal(createResult.status, 401);

    const updateResult = await request<Record<string, unknown>>(baseUrl, '/api/hackathons/1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Unauthorized' }),
    });
    assert.equal(updateResult.status, 401);

    const deleteResult = await request<Record<string, unknown>>(baseUrl, '/api/hackathons/1', {
      method: 'DELETE',
    });
    assert.equal(deleteResult.status, 401);
  });

  test('does not reseed cards after admin deletion', async () => {
    const dbPath = path.join(tempDir, 'no-reseed.sqlite');
    const firstDatabase = createDatabase({ dbPath });
    const firstRepository = new HackathonsRepository(firstDatabase);
    const firstList = firstRepository.list();
    assert.equal(firstList.length, 2);

    firstRepository.delete(firstList[0].id);
    firstDatabase.close();

    const secondDatabase = createDatabase({ dbPath });
    const secondRepository = new HackathonsRepository(secondDatabase);
    const secondList = secondRepository.list();
    assert.equal(secondList.length, 1);
    assert.equal(secondList.some((card) => card.id === firstList[0].id), false);
    secondDatabase.close();
  });
});
