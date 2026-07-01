import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';
import sharp from 'sharp';

import { createApp } from './app.ts';

type JsonValue = Record<string, unknown> | unknown[];

async function request<T extends JsonValue | undefined>(
  baseUrl: string,
  pathname: string,
  init?: RequestInit,
): Promise<{ status: number; headers: Headers; body: T }> {
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
    headers: response.headers,
    body: (text ? JSON.parse(text) : undefined) as T,
  };
}

describe('activities API', () => {
  let tempDir = '';
  let app: Express;
  let server: Server;
  let baseUrl = '';
  let adminToken = '';

  before(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'de-butler-activities-'));
    app = createApp({
      dbPath: path.join(tempDir, 'activities.sqlite'),
      uploadRoot: path.join(tempDir, 'uploads'),
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();
    assert.equal(typeof address, 'object');
    assert(address);
    baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;

    const login = await request<Record<string, unknown>>(baseUrl, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'De-Butler', password: 'debutlerzzang' }),
    });
    adminToken = String(login.body.token);
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    app.locals.database.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  test('creates, lists, updates, reads, and deletes an activity with an image URL', async () => {
    const emptyList = await request<unknown[]>(baseUrl, '/api/activities');
    assert.equal(emptyList.status, 200);
    assert.deepEqual(emptyList.body, []);

    const createResult = await request<Record<string, unknown>>(baseUrl, '/api/activities', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Blockchain Study Session',
        category: 'Session',
        date: '2026-02-20',
        description: 'Weekly blockchain technology seminar.',
        imageUrl: '/uploads/activities/study-session.jpg',
      }),
    });

    assert.equal(createResult.status, 201);
    assert.equal(createResult.body.title, 'Blockchain Study Session');
    assert.equal(createResult.body.category, 'Session');
    assert.equal(createResult.body.date, '2026-02-20');
    assert.equal(createResult.body.description, 'Weekly blockchain technology seminar.');
    assert.equal(createResult.body.imageUrl, '/uploads/activities/study-session.jpg');
    assert.equal(typeof createResult.body.id, 'number');

    const listResult = await request<Record<string, unknown>[]>(baseUrl, '/api/activities');
    assert.equal(listResult.status, 200);
    assert.equal(listResult.body.length, 1);
    assert.equal(listResult.body[0].title, 'Blockchain Study Session');

    const activityId = createResult.body.id;
    const updateResult = await request<Record<string, unknown>>(baseUrl, `/api/activities/${activityId}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Blockchain Study Session Updated',
        imageUrl: '/uploads/activities/study-session-updated.jpg',
      }),
    });

    assert.equal(updateResult.status, 200);
    assert.equal(updateResult.body.title, 'Blockchain Study Session Updated');
    assert.equal(updateResult.body.category, 'Session');
    assert.equal(updateResult.body.imageUrl, '/uploads/activities/study-session-updated.jpg');

    const readResult = await request<Record<string, unknown>>(baseUrl, `/api/activities/${activityId}`);
    assert.equal(readResult.status, 200);
    assert.equal(readResult.body.title, 'Blockchain Study Session Updated');

    const deleteResult = await request<undefined>(baseUrl, `/api/activities/${activityId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deleteResult.status, 204);

    const missingResult = await request<Record<string, unknown>>(baseUrl, `/api/activities/${activityId}`);
    assert.equal(missingResult.status, 404);
    assert.equal(missingResult.body.error, 'Activity not found');
  });

  test('rejects invalid activity payloads', async () => {
    const missingTitle = await request<Record<string, unknown>>(baseUrl, '/api/activities', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ date: '2026-02-20' }),
    });

    assert.equal(missingTitle.status, 400);
    assert.equal(missingTitle.body.error, 'title is required');

    const missingImageUrl = await request<Record<string, unknown>>(baseUrl, '/api/activities', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'No Image', date: '2026-02-20', imageUrl: 'https://example.com/a.jpg' }),
    });

    assert.equal(missingImageUrl.status, 400);
    assert.equal(missingImageUrl.body.error, 'imageUrl must start with /uploads/activities/');
  });

  test('optimizes uploaded activity images for display', async () => {
    const tinyPngBase64 = (await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: '#00f000',
      },
    }).png().toBuffer()).toString('base64');

    const uploadResult = await request<Record<string, unknown>>(baseUrl, '/api/activities/images', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        fileName: 'session-poster.png',
        mimeType: 'image/png',
        dataBase64: tinyPngBase64,
      }),
    });

    assert.equal(uploadResult.status, 201);
    assert.match(String(uploadResult.body.imageUrl), /^\/uploads\/activities\/session-poster-[a-f0-9]+\.webp$/);

    const storedPath = path.join(
      tempDir,
      'uploads',
      'activities',
      path.basename(String(uploadResult.body.imageUrl)),
    );
    const storedBytes = await readFile(storedPath);

    assert.equal(storedBytes.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(storedBytes.subarray(8, 12).toString('ascii'), 'WEBP');

    await rm(storedPath, { force: true });
  });

  test('accepts uploaded activity images above the previous 2 MB limit', async () => {
    const width = 1100;
    const height = 1100;
    const largePngBase64 = (await sharp(crypto.randomBytes(width * height * 3), {
      raw: { width, height, channels: 3 },
    }).png().toBuffer()).toString('base64');

    assert.ok(Buffer.byteLength(largePngBase64, 'base64') > 2 * 1024 * 1024);

    const uploadResult = await request<Record<string, unknown>>(baseUrl, '/api/activities/images', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        fileName: 'large-session.png',
        mimeType: 'image/png',
        dataBase64: largePngBase64,
      }),
    });

    assert.equal(uploadResult.status, 201);
    assert.match(String(uploadResult.body.imageUrl), /^\/uploads\/activities\/large-session-[a-f0-9]+\.webp$/);

    await rm(path.join(
      tempDir,
      'uploads',
      'activities',
      path.basename(String(uploadResult.body.imageUrl)),
    ), { force: true });
  });

  test('lists activities by newest date first instead of sort order', async () => {
    const older = await request<Record<string, unknown>>(baseUrl, '/api/activities', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Older Activity',
        category: 'Build',
        date: '2026-01-05',
        sortOrder: -100,
      }),
    });
    assert.equal(older.status, 201);

    const newer = await request<Record<string, unknown>>(baseUrl, '/api/activities', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Newer Activity',
        category: 'Network',
        date: '2026-07-20',
        sortOrder: 100,
      }),
    });
    assert.equal(newer.status, 201);

    const list = await request<Record<string, unknown>[]>(baseUrl, '/api/activities');

    assert.equal(list.status, 200);
    assert.equal(list.body[0].title, 'Newer Activity');
    assert.equal(list.body[1].title, 'Older Activity');
  });

  test('serves activity images from the server with cache headers', async () => {
    const imageDir = path.join(tempDir, 'uploads', 'activities');
    await mkdir(imageDir, { recursive: true });
    await writeFile(path.join(imageDir, 'study-session.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

    const response = await fetch(`${baseUrl}/uploads/activities/study-session.jpg`);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/jpeg');
    assert.match(response.headers.get('cache-control') || '', /public/);
    assert.match(response.headers.get('cache-control') || '', /max-age=/);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  });
});

describe('uploaded activity image sync', () => {
  let tempDir = '';
  let app: Express;
  let server: Server;
  let baseUrl = '';

  before(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'de-butler-upload-sync-'));
    const imageDir = path.join(tempDir, 'uploads', 'activities');
    await mkdir(imageDir, { recursive: true });
    await writeFile(path.join(imageDir, 'KakaoTalk_20260629_223328648.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

    app = createApp({
      dbPath: path.join(tempDir, 'activities.sqlite'),
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

  test('lists uploaded image files as activities without manual database rows', async () => {
    const listResult = await request<Record<string, unknown>[]>(baseUrl, '/api/activities');

    assert.equal(listResult.status, 200);
    assert.equal(listResult.body.length, 1);
    assert.equal(listResult.body[0].title, 'KakaoTalk 20260629 223328648');
    assert.equal(listResult.body[0].imageUrl, '/uploads/activities/KakaoTalk_20260629_223328648.jpg');
  });
});
