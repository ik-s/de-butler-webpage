import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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

describe('admin authentication', () => {
  let tempDir = '';
  let app: Express;
  let server: Server;
  let baseUrl = '';

  before(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'de-butler-admin-'));
    app = createApp({
      dbPath: path.join(tempDir, 'admin.sqlite'),
      uploadRoot: path.join(tempDir, 'uploads'),
    });

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

  test('issues a token for the configured admin account', async () => {
    const result = await request<Record<string, unknown>>(baseUrl, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'De-Butler', password: 'debutlerzzang' }),
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.username, 'De-Butler');
    assert.equal(typeof result.body.token, 'string');
  });

  test('rejects invalid admin credentials', async () => {
    const result = await request<Record<string, unknown>>(baseUrl, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'De-Butler', password: 'wrong' }),
    });

    assert.equal(result.status, 401);
    assert.equal(result.body.error, 'Invalid admin credentials');
  });

  test('requires admin token for activity mutations', async () => {
    const result = await request<Record<string, unknown>>(baseUrl, '/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Unauthorized',
        date: '2026.06.29',
      }),
    });

    assert.equal(result.status, 401);
    assert.equal(result.body.error, 'Admin authentication required');
  });

  test('allows image upload and activity creation with admin token', async () => {
    const login = await request<Record<string, unknown>>(baseUrl, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'De-Butler', password: 'debutlerzzang' }),
    });
    const token = String(login.body.token);

    const upload = await request<Record<string, unknown>>(baseUrl, '/api/activities/images', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fileName: 'seminar.jpg',
        mimeType: 'image/jpeg',
        dataBase64: Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64'),
      }),
    });

    assert.equal(upload.status, 201);
    assert.match(String(upload.body.imageUrl), /^\/uploads\/activities\/seminar-[a-f0-9]+\.jpg$/);

    const imagePath = path.join(tempDir, 'uploads', 'activities', path.basename(String(upload.body.imageUrl)));
    assert.deepEqual(await readFile(imagePath), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

    const created = await request<Record<string, unknown>>(baseUrl, '/api/activities', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Admin Created Activity',
        category: 'Activity',
        date: '2026.06.29',
        description: 'Created from the admin UI.',
        imageUrl: upload.body.imageUrl,
      }),
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.title, 'Admin Created Activity');
    assert.equal(created.body.imageUrl, upload.body.imageUrl);
  });

  test('accepts an issued admin token after app recreation', async () => {
    const login = await request<Record<string, unknown>>(baseUrl, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'De-Butler', password: 'debutlerzzang' }),
    });
    const token = String(login.body.token);
    const recreatedApp = createApp({
      dbPath: path.join(tempDir, 'admin-recreated.sqlite'),
      uploadRoot: path.join(tempDir, 'uploads-recreated'),
    });
    let recreatedServer: Server | undefined;

    try {
      await new Promise<void>((resolve) => {
        recreatedServer = recreatedApp.listen(0, '127.0.0.1', resolve);
      });
      const address = recreatedServer.address();
      assert.equal(typeof address, 'object');
      assert(address);
      const recreatedBaseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;

      const created = await request<Record<string, unknown>>(recreatedBaseUrl, '/api/activities', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: 'Token Reuse Activity',
          category: 'Session',
          date: '2026-06-29',
        }),
      });

      assert.equal(created.status, 201);
      assert.equal(created.body.title, 'Token Reuse Activity');
    } finally {
      recreatedApp.locals.database.close();
      if (recreatedServer) {
        await new Promise<void>((resolve, reject) => {
          recreatedServer?.close((error) => (error ? reject(error) : resolve()));
        });
      }
    }
  });
});
