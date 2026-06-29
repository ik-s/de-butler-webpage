import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import App, { ActivityImageGrid } from './App.tsx';
import { ActivityEditModal, ActivityForm } from './pages/Activities.tsx';
import { EventForm, EventList } from './pages/Events.tsx';

function renderRoute(pathname: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[pathname]}>
      <App />
    </MemoryRouter>,
  );
}

function withStoredAdminSession<T>(callback: () => T): T {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const sessionJson = JSON.stringify({ token: 'admin-token', username: 'De-Butler' });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => (key === 'de-butler-admin-session' ? sessionJson : null),
        setItem: () => undefined,
        removeItem: () => undefined,
      },
    },
  });

  try {
    return callback();
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  }
}

describe('app routes', () => {
  test('navigation links Activities and Login to dedicated pages', () => {
    const html = renderRoute('/');

    assert.match(html, /href="\/activities"/);
    assert.match(html, /href="\/login"/);
    assert.match(
      html,
      /class="hidden rounded-full bg-black px-6 py-4 text-sm font-extrabold text-white shadow-\[0_16px_32px_rgba\(0,0,0,0\.18\)\] transition-colors hover:bg-neon-green hover:text-black sm:block" href="\/login"/,
    );
    assert.doesNotMatch(html, /href="\/#activities"/);
  });

  test('shows the header Contact link only on the main page', () => {
    const homeHtml = renderRoute('/');

    assert.match(homeHtml, /href="\/#contact"/);

    for (const pathname of ['/about', '/activities', '/events', '/login']) {
      const html = renderRoute(pathname);

      assert.doesNotMatch(html, /href="\/#contact"/);
    }
  });

  test('renders a dedicated login page', () => {
    const html = renderRoute('/login');

    assert.match(html, /Admin Login/);
    assert.match(html, /Password/);
    assert.match(html, /Back Home/);
  });

  test('renders admin ID and icon logout in the header after login', () => {
    const html = withStoredAdminSession(() => renderRoute('/'));

    assert.match(html, /De-Butler/);
    assert.match(html, /lucide-user/);
    assert.match(html, /aria-label="Logout admin account"/);
    assert.match(html, /lucide-log-out/);
    assert.doesNotMatch(html, />ADMIN</);
    assert.doesNotMatch(html, />Logout</);
    assert.doesNotMatch(html, /href="\/login"[^>]*>Login</);
  });

  test('renders the activities page without admin controls for visitors', () => {
    const html = renderRoute('/activities');

    assert.match(html, /All Activities/i);
    assert.match(html, /De-Butler Activities/);
    assert.match(html, /Loading activities/);
    assert.doesNotMatch(html, /Admin Login/);
    assert.doesNotMatch(html, /Password/);
    assert.doesNotMatch(html, /Admin Controls/);
    assert.doesNotMatch(html, /Create Activity/);
  });

  test('renders the events page without admin controls for visitors', () => {
    const html = renderRoute('/events');

    assert.match(html, /All EVENTS/);
    assert.match(html, /WHAT DOES/);
    assert.match(html, /UPCOMING/);
    assert.match(html, /class=\"mx-auto w-full max-w-7xl px-6 pt-12 md:px-10\"/);
    assert.doesNotMatch(html, /class=\"mx-auto w-full max-w-7xl px-6 py-12 md:px-10\"/);
    assert.match(html, /class=\"mt-20 flex flex-wrap justify-center gap-x-12 gap-y-4 pb-5\"/);
    assert.doesNotMatch(html, /class=\"pb-5 text-xl/);
    assert.match(html, /De-Butler가 하는 일/);
    assert.doesNotMatch(html, /Admin Controls/);
    assert.doesNotMatch(html, /Create Event/);
  });

  test('renders a post button before activity create controls after login', () => {
    const activitiesHtml = withStoredAdminSession(() => renderRoute('/activities'));

    assert.match(activitiesHtml, />POST</);
    assert.doesNotMatch(activitiesHtml, /Admin Controls/);
    assert.doesNotMatch(activitiesHtml, /Create Activity/);
  });

  test('activity form uses calendar date and fixed category dropdown without sort order', () => {
    const html = renderToString(
      <ActivityForm
        form={{
          title: '',
          category: 'Session',
          date: '',
          description: '',
          imageFile: null,
        }}
        submitLabel="Create Activity"
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    assert.match(html, /type="date"/);
    assert.match(html, /<select/);
    assert.match(html, /Session/);
    assert.match(html, /Event/);
    assert.match(html, /Build/);
    assert.match(html, /Network/);
    assert.doesNotMatch(html, /Sort/);
    assert.doesNotMatch(html, /sortOrder/);
  });

  test('activity edit form shows the existing selected image', () => {
    const html = renderToString(
      <ActivityForm
        form={{
          title: 'Study Session',
          category: 'Session',
          date: '2026-06-29',
          description: '',
          imageFile: null,
        }}
        submitLabel="Save Changes"
        currentImageUrl="/uploads/activities/session.jpg"
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    assert.match(html, /Current selected image/);
    assert.ok(html.includes('src="/uploads/activities/session.jpg"'));
    assert.match(html, /Keep this image unless you choose a new file/);
  });

  test('renders a post button before event create controls after login', () => {
    const eventsHtml = withStoredAdminSession(() => renderRoute('/events'));

    assert.match(eventsHtml, />POST</);
    assert.doesNotMatch(eventsHtml, /Admin Controls/);
    assert.doesNotMatch(eventsHtml, /Create Event/);
  });

  test('event form uses category dropdown and link URL instead of location or image URL', () => {
    const html = renderToString(
      <EventForm
        form={{
          title: '',
          category: 'WHAT DOES',
          date: '',
          description: '',
          linkUrl: '',
        }}
        submitLabel="Create Event"
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    assert.match(html, /<select/);
    assert.match(html, /WHAT DOES/);
    assert.match(html, /UPCOMING/);
    assert.match(html, /Link URL/);
    assert.doesNotMatch(html, /Location/);
    assert.doesNotMatch(html, /Image URL/);
  });

  test('activity edit form renders in a modal shell', () => {
    const html = renderToString(
      <ActivityEditModal title="Edit Activity" onClose={() => undefined}>
        <button type="button">Save Changes</button>
      </ActivityEditModal>,
    );

    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /Edit Activity/);
    assert.match(html, /Save Changes/);
  });

  test('event list hides edit and delete controls for visitors and shows them for admins', () => {
    const event = {
      id: 1,
      title: 'Advanced Session Week 1',
      category: 'WHAT DOES' as const,
      date: '2026.04.06',
      description: 'Session notice.',
      linkUrl: 'https://example.com/session',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    };
    const visitorHtml = renderToString(
      <EventList events={[event]} session={null} onEdit={() => undefined} onDelete={() => undefined} />,
    );
    const adminHtml = renderToString(
      <EventList
        events={[event]}
        session={{ token: 'admin-token', username: 'De-Butelr' }}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

    assert.doesNotMatch(visitorHtml, /Edit/);
    assert.doesNotMatch(visitorHtml, /Delete/);
    assert.match(visitorHtml, /href="https:\/\/example.com\/session"/);
    assert.match(adminHtml, /Edit/);
    assert.match(adminHtml, /Delete/);
  });

  test('home activity grid can render backend image URLs', () => {
    const html = renderToString(
      <ActivityImageGrid
        activities={[
          {
            id: 1,
            title: 'KakaoTalk 20260629 223328648 01',
            category: 'Activity',
            date: '2026.06.29',
            description: null,
            imageUrl: '/uploads/activities/KakaoTalk_20260629_223328648_01.jpg',
          },
        ]}
      />,
    );

    assert.match(html, /src="\/uploads\/activities\/KakaoTalk_20260629_223328648_01\.jpg"/);
    assert.doesNotMatch(html, /Activity image placeholder/);
  });
});
