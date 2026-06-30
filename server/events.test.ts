import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';

import { createApp } from './app.ts';

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

describe('events API', () => {
  let tempDir = '';
  let app: Express;
  let server: Server;
  let baseUrl = '';

  before(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'de-butler-events-'));
    app = createApp({ dbPath: path.join(tempDir, 'events.sqlite') });

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

  test('creates, lists, updates, reads, and deletes an event with admin token', async () => {
    const emptyList = await request<unknown[]>(baseUrl, '/api/events');
    assert.equal(emptyList.status, 200);
    assert.deepEqual(emptyList.body, []);
    const token = await loginAdmin(baseUrl);

    const createResult = await request<Record<string, unknown>>(baseUrl, '/api/events', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Advanced Session Week 1',
        category: 'WHAT DOES',
        date: '2026.04.06',
        description: 'De-Butler advanced session notice.',
        linkUrl: 'https://example.com/session-1',
      }),
    });

    assert.equal(createResult.status, 201);
    assert.equal(createResult.body.title, 'Advanced Session Week 1');
    assert.equal(createResult.body.category, 'WHAT DOES');
    assert.equal(createResult.body.date, '2026.04.06');
    assert.equal(createResult.body.description, 'De-Butler advanced session notice.');
    assert.equal(createResult.body.linkUrl, 'https://example.com/session-1');
    assert.equal(createResult.body.done, false);
    assert.equal(typeof createResult.body.id, 'number');
    assert.equal(typeof createResult.body.createdAt, 'string');
    assert.equal(typeof createResult.body.updatedAt, 'string');

    const listResult = await request<Record<string, unknown>[]>(baseUrl, '/api/events');
    assert.equal(listResult.status, 200);
    assert.equal(listResult.body.length, 1);
    assert.equal(listResult.body[0].title, 'Advanced Session Week 1');

    const eventId = createResult.body.id;
    const updateResult = await request<Record<string, unknown>>(baseUrl, `/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Advanced Session Week 1 Updated',
        category: 'UPCOMING',
        done: true,
        linkUrl: 'https://example.com/session-1-updated',
      }),
    });

    assert.equal(updateResult.status, 200);
    assert.equal(updateResult.body.title, 'Advanced Session Week 1 Updated');
    assert.equal(updateResult.body.category, 'UPCOMING');
    assert.equal(updateResult.body.date, '2026.04.06');
    assert.equal(updateResult.body.linkUrl, 'https://example.com/session-1-updated');
    assert.equal(updateResult.body.done, true);

    const readResult = await request<Record<string, unknown>>(baseUrl, `/api/events/${eventId}`);
    assert.equal(readResult.status, 200);
    assert.equal(readResult.body.title, 'Advanced Session Week 1 Updated');
    assert.equal(readResult.body.done, true);

    const deleteResult = await request<undefined>(baseUrl, `/api/events/${eventId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(deleteResult.status, 204);

    const missingResult = await request<Record<string, unknown>>(baseUrl, `/api/events/${eventId}`);
    assert.equal(missingResult.status, 404);
    assert.equal(missingResult.body.error, 'Event not found');
  });

  test('requires admin token for event mutations', async () => {
    const createResult = await request<Record<string, unknown>>(baseUrl, '/api/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'Admin Notice', date: '2026.04.06' }),
    });
    assert.equal(createResult.status, 401);
    assert.equal(createResult.body.error, 'Admin authentication required');

    const updateResult = await request<Record<string, unknown>>(baseUrl, '/api/events/1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Edit Attempt' }),
    });
    assert.equal(updateResult.status, 401);
    assert.equal(updateResult.body.error, 'Admin authentication required');

    const deleteResult = await request<Record<string, unknown>>(baseUrl, '/api/events/1', {
      method: 'DELETE',
    });
    assert.equal(deleteResult.status, 401);
    assert.equal(deleteResult.body.error, 'Admin authentication required');
  });

  test('rejects invalid event payloads', async () => {
    const token = await loginAdmin(baseUrl);
    const missingTitle = await request<Record<string, unknown>>(baseUrl, '/api/events', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ date: '2026.04.06' }),
    });

    assert.equal(missingTitle.status, 400);
    assert.equal(missingTitle.body.error, 'title is required');

    const missingDate = await request<Record<string, unknown>>(baseUrl, '/api/events', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Recruiting' }),
    });

    assert.equal(missingDate.status, 400);
    assert.equal(missingDate.body.error, 'date is required');

    const invalidCategory = await request<Record<string, unknown>>(baseUrl, '/api/events', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Recruiting', category: 'OTHER', date: '2026.04.06' }),
    });

    assert.equal(invalidCategory.status, 400);
    assert.equal(invalidCategory.body.error, 'category must be WHAT DOES or UPCOMING');
  });

  test('returns 404 when mutating an unknown event', async () => {
    const token = await loginAdmin(baseUrl);
    const updateResult = await request<Record<string, unknown>>(baseUrl, '/api/events/9999', {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Unknown Event' }),
    });
    assert.equal(updateResult.status, 404);
    assert.equal(updateResult.body.error, 'Event not found');

    const deleteResult = await request<Record<string, unknown>>(baseUrl, '/api/events/9999', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(deleteResult.status, 404);
    assert.equal(deleteResult.body.error, 'Event not found');
  });
});
