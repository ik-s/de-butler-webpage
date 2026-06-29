import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from './eventsApi.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchEvents', () => {
  test('loads events from the backend API', async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return new Response(
        JSON.stringify([
          {
            id: 1,
            title: '심화세션 1주차 안내',
            category: 'WHAT DOES',
            date: '2026.04.06',
            description: 'De-Butler 심화 세션 안내입니다.',
            linkUrl: 'https://example.com/session',
            createdAt: '2026-04-01T00:00:00.000Z',
            updatedAt: '2026-04-01T00:00:00.000Z',
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    const events = await fetchEvents();

    assert.deepEqual(requests, ['/api/events']);
    assert.equal(events.length, 1);
    assert.equal(events[0].title, '심화세션 1주차 안내');
  });

  test('throws when the backend API fails', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'database unavailable' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });

    await assert.rejects(fetchEvents, /database unavailable/);
  });
});

describe('admin event API client', () => {
  test('sends bearer token for create, update, and delete', async () => {
    const calls: Array<{ url: string; method?: string; auth?: string; body?: unknown }> = [];
    globalThis.fetch = async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method,
        auth: init?.headers ? (init.headers as Record<string, string>).authorization : undefined,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });

      if (init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }

      return new Response(
        JSON.stringify({
          id: 1,
          title: '심화세션 1주차 안내',
          category: 'WHAT DOES',
          date: '2026.04.06',
          description: null,
          linkUrl: null,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        }),
        { status: init?.method === 'POST' ? 201 : 200, headers: { 'content-type': 'application/json' } },
      );
    };

    await createEvent('admin-token', {
      title: '심화세션 1주차 안내',
      category: 'WHAT DOES',
      date: '2026.04.06',
      description: '공지 본문',
      linkUrl: 'https://example.com/session',
    });
    await updateEvent('admin-token', 1, { category: 'UPCOMING', linkUrl: 'https://example.com/updated' });
    await deleteEvent('admin-token', 1);

    assert.deepEqual(
      calls.map((call) => [call.url, call.method, call.auth]),
      [
        ['/api/events', 'POST', 'Bearer admin-token'],
        ['/api/events/1', 'PATCH', 'Bearer admin-token'],
        ['/api/events/1', 'DELETE', 'Bearer admin-token'],
      ],
    );
  });
});
