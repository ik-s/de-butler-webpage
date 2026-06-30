import type { EventRecord } from "./eventsApi";

export const hiddenDefaultEventsStorageKey = "de-butler:hidden-default-event-ids";

export type HomeWhatDoesItem = {
  title: string;
  category: string;
  date: string;
  linkUrl?: string | null;
};

export type HomeUpcomingItem = {
  title: string;
  date: string;
};

export const homeWhatDoesItems: HomeWhatDoesItem[] = [
  { title: "주간 블록체인 기술 세미나 및 네트워킹", category: "Core", date: "Feb 20, 2026" },
  { title: "Web3 빌더를 위한 온보딩 워크샵", category: "Event", date: "Feb 15, 2026" },
  { title: "국내외 주요 블록체인 컨퍼런스 참여", category: "Core", date: "Jan 28, 2026" },
  { title: "학회원 간의 친목 도모를 위한 '버틀러 나잇'", category: "Social", date: "Jan 10, 2026" },
  { title: "광운대학교 블록체인 커뮤니티 빌딩", category: "Core", date: "Jan 05, 2026" },
];

export const homeUpcomingItems: HomeUpcomingItem[] = [
  { title: "리크루팅", date: "03.04" },
  { title: "NOT CENT ANYMORE 부스 진행", date: "03.04" },
];

export const defaultEventRecords: EventRecord[] = [
  ...homeWhatDoesItems.map((item, index) => ({
    id: -(index + 1),
    title: item.title,
    category: "WHAT DOES" as const,
    date: item.date,
    description: null,
    linkUrl: `/events/what-does-${index + 1}`,
    done: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  })),
  ...homeUpcomingItems.map((item, index) => ({
    id: -(homeWhatDoesItems.length + index + 1),
    title: item.title,
    category: "UPCOMING" as const,
    date: item.date,
    description: null,
    linkUrl: `/events/upcoming-${index + 1}`,
    done: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  })),
];

export function isDefaultEventRecord(event: EventRecord) {
  return event.id < 0;
}

export function loadHiddenDefaultEventIds(): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(hiddenDefaultEventsStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

export function saveHiddenDefaultEventIds(ids: number[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(hiddenDefaultEventsStorageKey, JSON.stringify(ids));
}

export function mergeDefaultEventRecords(events: EventRecord[], hiddenDefaultEventIds: number[] = []): EventRecord[] {
  const hiddenIds = new Set(hiddenDefaultEventIds);
  const visibleDefaultEvents = defaultEventRecords.filter((event) => !hiddenIds.has(event.id));
  const seen = new Set(visibleDefaultEvents.map((event) => `${event.category}::${event.title}::${event.date}`));
  const serverEvents = events.filter((event) => {
    const key = `${event.category}::${event.title}::${event.date}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return [...visibleDefaultEvents, ...serverEvents];
}

export function buildHomeEventColumns(events: EventRecord[], hiddenDefaultEventIds: number[] = []) {
  const mergedEvents = mergeDefaultEventRecords(events, hiddenDefaultEventIds);

  return {
    whatDoes: mergedEvents
      .filter((event) => event.category === "WHAT DOES")
      .map((event) => {
        const defaultIndex = isDefaultEventRecord(event) ? -event.id - 1 : -1;

        return {
          title: event.title,
          date: event.date,
          linkUrl: event.linkUrl,
          category: defaultIndex >= 0 ? homeWhatDoesItems[defaultIndex]?.category || event.category : event.category,
        };
      })
      .slice(0, 6),
    upcoming: mergedEvents
      .filter((event) => event.category === "UPCOMING" && !event.done)
      .map((event) => ({
        title: event.title,
        date: event.date,
      }))
      .slice(0, 6),
  };
}
