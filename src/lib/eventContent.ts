import type { EventRecord } from "./eventsApi";

export function buildHomeEventColumns(events: EventRecord[]) {
  return {
    whatDoes: events
      .filter((event) => event.category === "WHAT DOES")
      .map((event) => ({
        title: event.title,
        date: event.date,
        linkUrl: event.linkUrl,
        category: event.category,
      }))
      .slice(0, 6),
    upcoming: events
      .filter((event) => event.category === "UPCOMING" && !event.done)
      .map((event) => ({
        title: event.title,
        date: event.date,
      }))
      .slice(0, 6),
  };
}
