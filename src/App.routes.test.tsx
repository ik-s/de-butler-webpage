import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import App, { ActivityImageGrid, ActivityItem, formatHomeUpcomingDate } from './App.tsx';
import { buildHomeEventColumns } from './lib/eventContent.ts';
import { ActivityEditModal, ActivityForm, activityAdminErrorMessage } from './pages/Activities.tsx';
import About from './pages/About.tsx';
import { ApiError } from './lib/apiError.ts';
import type { EventRecord } from './lib/eventsApi.ts';
import {
  EventEditModal,
  EventForm,
  EventList,
  UpcomingViewSelector,
  paginateEvents,
  selectUpcomingViewEvents,
  splitUpcomingEvents,
} from './pages/Events.tsx';

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

  test('renders an accessible mobile menu shell in the sticky header', () => {
    const html = renderRoute('/');

    assert.match(html, /<nav class="sticky top-0 z-\[80\] border-b/);
    assert.match(html, /aria-label="Open menu"/);
    assert.match(html, /aria-controls="mobile-menu"/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /id="mobile-menu"/);
    assert.match(html, /href="\/about"/);
    assert.match(html, /href="\/activities"/);
    assert.match(html, /href="\/events"/);
    assert.match(
      html,
      /class="bg-black px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-neon-green hover:text-black">Join Us<\/button>/,
    );
  });

  test('formats main page upcoming dates with month and day only', () => {
    assert.equal(formatHomeUpcomingDate('2026-07-01'), '07.01');
    assert.equal(formatHomeUpcomingDate('2026-12-31'), '12.31');
    assert.equal(formatHomeUpcomingDate('04.01'), '04.01');
  });

  test('main page about summary cards use the vision hover bar effect', () => {
    const html = renderRoute('/');

    assert.equal(html.match(/group-hover:scale-y-100/g)?.length ?? 0, 3);
  });

  test('about what we do cards are static content without hover color or modal trigger', () => {
    const html = renderToString(<About />);

    assert.equal(html.match(/type="button"/g)?.length ?? 0, 0);
    assert.doesNotMatch(html, /hover:bg-neon-green hover:text-black hover:border-neon-green/);
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
    assert.match(html, /class=\"mt-20 flex flex-wrap justify-center gap-x-12 gap-y-4 pb-[^"]+\"/);
    assert.doesNotMatch(html, /class=\"pb-[^"]+ text-xl/);
    assert.doesNotMatch(html, /주간 블록체인 기술 세미나 및 네트워킹/);
    assert.doesNotMatch(html, /Admin Controls/);
    assert.doesNotMatch(html, /Create Event/);
  });

  test('does not render hard-coded default events when the backend returns no events', () => {
    assert.deepEqual(buildHomeEventColumns([]), { whatDoes: [], upcoming: [] });
  });

  test('builds main page event columns from backend records only', () => {
    const events: EventRecord[] = [
      {
        id: 101,
        title: '서버 WHAT DOES 이벤트',
        category: 'WHAT DOES',
        date: '2026-07-01',
        description: null,
        linkUrl: 'https://example.com/server-event',
        done: false,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 102,
        title: '서버 예정 이벤트',
        category: 'UPCOMING',
        date: '2026-08-01',
        description: null,
        linkUrl: null,
        done: false,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 103,
        title: '완료된 일정',
        category: 'UPCOMING',
        date: '2026-03-04',
        description: null,
        linkUrl: null,
        done: true,
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      },
    ];

    const columns = buildHomeEventColumns(events);

    assert.deepEqual(columns.whatDoes.map(({ title, linkUrl }) => ({ title, linkUrl })), [
      { title: '서버 WHAT DOES 이벤트', linkUrl: 'https://example.com/server-event' },
    ]);
    assert.deepEqual(columns.upcoming.map((event) => event.title), ['서버 예정 이벤트']);
  });

  test('limits main page event columns to six items each', () => {
    const extraEvents: EventRecord[] = Array.from({ length: 14 }, (_, index) => ({
      id: 300 + index,
      title: `추가 일정 ${index + 1}`,
      category: index % 2 === 0 ? 'WHAT DOES' : 'UPCOMING',
      date: `2026-07-${String(index + 1).padStart(2, '0')}`,
      description: null,
      linkUrl: index % 2 === 0 ? `https://example.com/event-${index + 1}` : null,
      done: false,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    }));

    const columns = buildHomeEventColumns(extraEvents);

    assert.equal(columns.whatDoes.length, 6);
    assert.equal(columns.upcoming.length, 6);
  });

  test('main page what does items open link URLs in a new tab', () => {
    const html = renderToString(
      <ActivityItem
        category="WHAT DOES"
        title="Innovation Camp Hackathon"
        date="2023-11-13"
        linkUrl="https://example.com/hackathon"
      />,
    );

    assert.match(html, /href="https:\/\/example.com\/hackathon"/);
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noreferrer"/);
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

  test('activity admin errors preserve useful upload failure messages', () => {
    assert.equal(
      activityAdminErrorMessage(new ApiError('Image must be 25 MB or smaller', 400), 'Activity create failed.'),
      'Image must be 25 MB or smaller',
    );
    assert.equal(activityAdminErrorMessage(new Error('Failed to read image file'), 'Activity create failed.'), 'Failed to read image file');
    assert.equal(activityAdminErrorMessage('unknown', 'Activity create failed.'), 'Activity create failed.');
  });

  test('renders a post button before event create controls after login', () => {
    const eventsHtml = withStoredAdminSession(() => renderRoute('/events'));

    assert.match(eventsHtml, />POST</);
    assert.doesNotMatch(eventsHtml, /Admin Controls/);
    assert.doesNotMatch(eventsHtml, /Create Event/);
  });

  test('event form uses calendar date, category dropdown, and link URL instead of location or image URL', () => {
    const html = renderToString(
      <EventForm
        form={{
          title: '',
          category: 'WHAT DOES',
          date: '',
          description: '',
          linkUrl: '',
          done: false,
        }}
        submitLabel="Create Event"
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    assert.match(html, /<select/);
    assert.match(html, /WHAT DOES/);
    assert.match(html, /UPCOMING/);
    assert.match(html, /type="date"/);
    assert.match(html, /Link URL/);
    assert.doesNotMatch(html, /Location/);
    assert.doesNotMatch(html, /Image URL/);
  });

  test('event form keeps link URL styling while blocking upcoming posts', () => {
    const html = renderToString(
      <EventForm
        form={{
          title: 'Upcoming Session',
          category: 'UPCOMING',
          date: '2026.07.01',
          description: '',
          linkUrl: 'https://example.com/should-not-render',
          done: true,
        }}
        submitLabel="Create Event"
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    assert.match(html, /Link URL/);
    assert.doesNotMatch(html, /disabled=""/);
    assert.match(html, /readOnly=""/);
    assert.match(html, /cursor-not-allowed/);
    assert.match(html, /title="UPCOMING posts do not use a link URL."/);
    assert.match(html, /Done/);
    assert.match(html, /value="false"/);
    assert.match(html, /value="true" selected=""/);
    assert.doesNotMatch(html, /should-not-render/);
  });

  test('splits upcoming events into scheduled and done groups', () => {
    const scheduledEvent = {
      id: 10,
      title: '리크루팅',
      category: 'UPCOMING' as const,
      date: '2026-03-04',
      description: null,
      linkUrl: null,
      done: false,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    };
    const doneEvent = {
      ...scheduledEvent,
      id: 11,
      title: '완료된 부스 진행',
      done: true,
    };

    const groups = splitUpcomingEvents([scheduledEvent, doneEvent]);

    assert.deepEqual(groups.scheduled.map((event) => event.title), ['리크루팅']);
    assert.deepEqual(groups.done.map((event) => event.title), ['완료된 부스 진행']);
  });

  test('selects one upcoming view at a time and paginates done events', () => {
    const scheduledEvent = {
      id: 10,
      title: '진행될 리크루팅',
      category: 'UPCOMING' as const,
      date: '2026-03-04',
      description: null,
      linkUrl: null,
      done: false,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    };
    const doneEvents = Array.from({ length: 6 }, (_, index) => ({
      ...scheduledEvent,
      id: index + 20,
      title: `지난 일정 ${index + 1}`,
      done: true,
    }));
    const groups = splitUpcomingEvents([scheduledEvent, ...doneEvents]);

    const scheduledView = selectUpcomingViewEvents(groups, 'scheduled', 1);
    const doneView = selectUpcomingViewEvents(groups, 'done', 2);

    assert.deepEqual(scheduledView.items.map((event) => event.title), ['진행될 리크루팅']);
    assert.equal(scheduledView.totalPages, 1);
    assert.deepEqual(doneView.items.map((event) => event.title), ['지난 일정 6']);
    assert.equal(doneView.totalPages, 2);
  });

  test('paginates event lists five items at a time', () => {
    const events = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      title: `페이지 이벤트 ${index + 1}`,
      category: 'WHAT DOES' as const,
      date: `2026-08-${String(index + 1).padStart(2, '0')}`,
      description: null,
      linkUrl: null,
      done: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    }));

    const firstPage = paginateEvents(events, 1);
    const thirdPage = paginateEvents(events, 3);

    assert.equal(firstPage.totalPages, 3);
    assert.deepEqual(firstPage.items.map((event) => event.title), [
      '페이지 이벤트 1',
      '페이지 이벤트 2',
      '페이지 이벤트 3',
      '페이지 이벤트 4',
      '페이지 이벤트 5',
    ]);
    assert.deepEqual(thirdPage.items.map((event) => event.title), ['페이지 이벤트 11', '페이지 이벤트 12']);
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

  test('event edit form renders in a modal shell', () => {
    const html = renderToString(
      <EventEditModal title="Edit Event" onClose={() => undefined}>
        <button type="button">Save Changes</button>
      </EventEditModal>,
    );

    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /Edit Event/);
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
      done: false,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    };
    const visitorHtml = renderToString(
      <EventList events={[event]} session={null} onEdit={() => undefined} onDelete={() => undefined} />,
    );
    const adminHtml = renderToString(
      <EventList
        events={[event]}
        session={{ token: 'admin-token', username: 'De-Butler' }}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

    assert.doesNotMatch(visitorHtml, /Edit/);
    assert.doesNotMatch(visitorHtml, /Delete/);
    assert.match(visitorHtml, /href="https:\/\/example.com\/session"/);
    assert.match(visitorHtml, /target="_blank"/);
    assert.match(visitorHtml, /rel="noreferrer"/);
    assert.match(adminHtml, /Edit/);
    assert.match(adminHtml, /Delete/);
  });

  test('upcoming tabs avoid divider lines and event items render as button cards', () => {
    const event = {
      id: 1,
      title: '리크루팅',
      category: 'UPCOMING' as const,
      date: '03.04',
      description: null,
      linkUrl: null,
      done: false,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    };
    const tabsHtml = renderToString(
      <UpcomingViewSelector activeView="scheduled" onChange={() => undefined} />,
    );
    const listHtml = renderToString(
      <EventList events={[event]} session={null} onEdit={() => undefined} onDelete={() => undefined} />,
    );

    assert.match(tabsHtml, /진행될 일정/);
    assert.match(tabsHtml, /지난 일정/);
    assert.doesNotMatch(tabsHtml, /border-b/);
    assert.doesNotMatch(listHtml, /divide-y/);
    assert.doesNotMatch(listHtml, /border-t/);
    assert.match(listHtml, /grid gap-5/);
    assert.match(listHtml, /border border-gray-200/);
    assert.match(listHtml, new RegExp('hover:bg-neon-green/10'));
  });

  test('event list shows admin controls for backend event records', () => {
    const adminHtml = renderToString(
      <EventList
        events={[
          {
            id: 1,
            title: 'Backend Event',
            category: 'WHAT DOES',
            date: '2026-07-01',
            description: null,
            linkUrl: null,
            done: false,
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
          },
        ]}
        session={{ token: 'admin-token', username: 'De-Butler' }}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

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
