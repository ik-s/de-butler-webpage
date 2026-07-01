import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import {
  createHackathon,
  deleteHackathon,
  fetchHackathons,
  updateHackathon,
} from './hackathonsApi.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchHackathons', () => {
  test('loads hackathon cards from the backend API', async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return new Response(
        JSON.stringify([
          {
            id: 1,
            label: 'Hackathon Archive',
            title: 'DE-BUTHON 2025',
            meta: '2025.03 - Kwangwoon University',
            imageUrl: '/hackathon/de-buthon-2025.webp',
            imageFit: 'cover',
            description: 'Archive description',
            linkUrl: 'https://www.hankyung.com/article/202503244674O',
            sortOrder: 10,
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    const cards = await fetchHackathons();

    assert.deepEqual(requests, ['/api/hackathons']);
    assert.equal(cards.length, 1);
    assert.equal(cards[0].title, 'DE-BUTHON 2025');
  });
});

describe('admin hackathon API client', () => {
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
          label: 'Hackathon Archive',
          title: 'DE-BUTHON 2025',
          meta: '2025.03 - Kwangwoon University',
          imageUrl: '/hackathon/de-buthon-2025.webp',
          imageFit: 'cover',
          description: 'Archive description',
          linkUrl: null,
          sortOrder: 10,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
        }),
        { status: init?.method === 'POST' ? 201 : 200, headers: { 'content-type': 'application/json' } },
      );
    };

    await createHackathon('admin-token', {
      label: 'Hackathon Archive',
      title: 'DE-BUTHON 2025',
      meta: '2025.03',
      imageUrl: '/hackathon/de-buthon-2025.webp',
      imageFit: 'cover',
      description: 'Archive description',
      linkUrl: null,
      sortOrder: 10,
    });
    await updateHackathon('admin-token', 1, { title: 'Updated Hackathon' });
    await deleteHackathon('admin-token', 1);

    assert.deepEqual(
      calls.map((call) => [call.url, call.method, call.auth]),
      [
        ['/api/hackathons', 'POST', 'Bearer admin-token'],
        ['/api/hackathons/1', 'PATCH', 'Bearer admin-token'],
        ['/api/hackathons/1', 'DELETE', 'Bearer admin-token'],
      ],
    );
  });
});
