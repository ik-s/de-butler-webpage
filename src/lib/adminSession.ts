import type { AdminSession } from "./activitiesApi";

const adminSessionKey = "de-butler-admin-session";
export const adminSessionChangedEvent = "de-butler-admin-session-change";

function notifyAdminSessionChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(adminSessionChangedEvent));
}

export function loadStoredAdminSession(): AdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(adminSessionKey);
    return stored ? (JSON.parse(stored) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function storeAdminSession(session: AdminSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(adminSessionKey, JSON.stringify(session));
  notifyAdminSessionChanged();
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(adminSessionKey);
  notifyAdminSessionChanged();
}
