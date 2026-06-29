import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import {
  createActivity,
  deleteActivity,
  fetchActivities,
  loginAdmin,
  updateActivity,
  uploadActivityImageData,
} from './activitiesApi.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchActivities', () => {
  test('loads activities from the backend API', async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return new Response(
        JSON.stringify([
          {
            id: 1,
            title: 'Blockchain Study Session',
            category: 'Core',
            date: 'Feb 20, 2026',
            description: 'Weekly blockchain technology seminar.',
            imageUrl: '/uploads/activities/study-session.jpg',
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    const activities = await fetchActivities();

    assert.deepEqual(requests, ['/api/activities']);
    assert.equal(activities.length, 1);
    assert.equal(activities[0].title, 'Blockchain Study Session');
    assert.equal(activities[0].imageUrl, '/uploads/activities/study-session.jpg');
  });

  test('throws when the backend API fails', async () => {
    globalThis.fetch = async () => new Response('server error', { status: 500 });

    await assert.rejects(fetchActivities, /Failed to load activities/);
  });
});

describe('admin activity API client', () => {
  test('logs in with admin credentials', async () => {
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), '/api/admin/login');
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), {
        username: 'De-Butelr',
        password: 'debutlerzzang',
      });

      return new Response(JSON.stringify({ token: 'admin-token', username: 'De-Butelr' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const session = await loginAdmin('De-Butelr', 'debutlerzzang');

    assert.deepEqual(session, { token: 'admin-token', username: 'De-Butelr' });
  });

  test('sends bearer token for create, update, delete, and image upload', async () => {
    const calls: Array<{ url: string; method?: string; auth?: string; body?: unknown }> = [];
    globalThis.fetch = async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method,
        auth: init?.headers ? (init.headers as Record<string, string>).authorization : undefined,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });

      if (String(input) === '/api/activities/images') {
        return new Response(JSON.stringify({ imageUrl: '/uploads/activities/seminar-abc123.jpg' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        });
      }

      if (init?.method === 'DELETE') {
        return new Response(undefined, { status: 204 });
      }

      return new Response(
        JSON.stringify({
          id: 1,
          title: 'Admin Activity',
          category: 'Activity',
          date: '2026.06.29',
          description: 'Admin edited.',
          imageUrl: '/uploads/activities/seminar-abc123.jpg',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    await uploadActivityImageData('admin-token', {
      fileName: 'seminar.jpg',
      mimeType: 'image/jpeg',
      dataBase64: 'abcd',
    });
    await createActivity('admin-token', {
      title: 'Admin Activity',
      category: 'Activity',
      date: '2026.06.29',
      description: 'Admin edited.',
      imageUrl: '/uploads/activities/seminar-abc123.jpg',
    });
    await updateActivity('admin-token', 1, { date: '2026.07.01' });
    await deleteActivity('admin-token', 1);

    assert.deepEqual(
      calls.map((call) => [call.url, call.method, call.auth]),
      [
        ['/api/activities/images', 'POST', 'Bearer admin-token'],
        ['/api/activities', 'POST', 'Bearer admin-token'],
        ['/api/activities/1', 'PATCH', 'Bearer admin-token'],
        ['/api/activities/1', 'DELETE', 'Bearer admin-token'],
      ],
    );
  });
});
