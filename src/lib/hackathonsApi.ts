import { ApiError } from "./apiError";

export type HackathonImageFit = "cover" | "contain";

export type HackathonRecord = {
  id: number;
  label: string;
  title: string;
  meta: string;
  imageUrl: string | null;
  imageFit: HackathonImageFit;
  description: string;
  linkUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type HackathonInput = {
  label: string;
  title: string;
  meta: string;
  imageUrl?: string | null;
  imageFit?: HackathonImageFit;
  description: string;
  linkUrl?: string | null;
  sortOrder?: number;
};

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

export async function fetchHackathons(): Promise<HackathonRecord[]> {
  const response = await fetch('/api/hackathons');
  return readJsonResponse<HackathonRecord[]>(response, 'Failed to load hackathons');
}

export async function createHackathon(token: string, input: HackathonInput): Promise<HackathonRecord> {
  const response = await fetch('/api/hackathons', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });

  return readJsonResponse<HackathonRecord>(response, 'Failed to create hackathon');
}

export async function updateHackathon(token: string, id: number, input: Partial<HackathonInput>): Promise<HackathonRecord> {
  const response = await fetch(`/api/hackathons/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });

  return readJsonResponse<HackathonRecord>(response, 'Failed to update hackathon');
}

export async function deleteHackathon(token: string, id: number): Promise<void> {
  const response = await fetch(`/api/hackathons/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  });

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new ApiError(body || 'Failed to delete hackathon', response.status);
  }
}
