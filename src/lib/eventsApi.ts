import { ApiError } from "./apiError";

export type EventCategory = 'WHAT DOES' | 'UPCOMING';

export type EventRecord = {
  id: number;
  title: string;
  category: EventCategory;
  date: string;
  description: string | null;
  linkUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventInput = {
  title: string;
  category?: EventCategory;
  date: string;
  description?: string | null;
  linkUrl?: string | null;
};

export async function fetchEvents(): Promise<EventRecord[]> {
  const response = await fetch('/api/events');

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new ApiError(body || 'Failed to load events', response.status);
  }

  return response.json() as Promise<EventRecord[]>;
}

function adminHeaders(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === 'string' ? body.error : '';
  } catch {
    return '';
  }
}

async function readJsonResponse<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new ApiError(body || errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}

export async function createEvent(token: string, input: EventInput): Promise<EventRecord> {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });

  return readJsonResponse<EventRecord>(response, 'Failed to create event');
}

export async function updateEvent(token: string, id: number, input: Partial<EventInput>): Promise<EventRecord> {
  const response = await fetch(`/api/events/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });

  return readJsonResponse<EventRecord>(response, 'Failed to update event');
}

export async function deleteEvent(token: string, id: number): Promise<void> {
  const response = await fetch(`/api/events/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  });

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new ApiError(body || 'Failed to delete event', response.status);
  }
}
