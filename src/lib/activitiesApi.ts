import { ApiError } from "./apiError";

export const maxActivityImageUploadBytes = 25 * 1024 * 1024;

export type Activity = {
  id: number;
  title: string;
  category: string | null;
  date: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder?: number;
};

export type AdminSession = {
  token: string;
  username: string;
};

export type ActivityInput = {
  title: string;
  category?: string | null;
  date: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

export type ActivityImageUpload = {
  fileName: string;
  mimeType: string;
  dataBase64: string;
};

export async function fetchActivities(): Promise<Activity[]> {
  const response = await fetch('/api/activities');

  if (!response.ok) {
    throw new ApiError('Failed to load activities', response.status);
  }

  return response.json() as Promise<Activity[]>;
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

export async function loginAdmin(username: string, password: string): Promise<AdminSession> {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  return readJsonResponse<AdminSession>(response, 'Admin login failed');
}

export async function uploadActivityImageData(
  token: string,
  upload: ActivityImageUpload,
): Promise<{ imageUrl: string }> {
  const response = await fetch('/api/activities/images', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(upload),
  });

  return readJsonResponse<{ imageUrl: string }>(response, 'Failed to upload activity image');
}

export async function uploadActivityImageFile(token: string, file: File): Promise<{ imageUrl: string }> {
  if (file.size > maxActivityImageUploadBytes) {
    throw new ApiError('Image must be 25 MB or smaller', 400);
  }

  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  return uploadActivityImageData(token, {
    fileName: file.name,
    mimeType: file.type,
    dataBase64,
  });
}

export async function createActivity(token: string, input: ActivityInput): Promise<Activity> {
  const response = await fetch('/api/activities', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });

  return readJsonResponse<Activity>(response, 'Failed to create activity');
}

export async function updateActivity(token: string, id: number, input: Partial<ActivityInput>): Promise<Activity> {
  const response = await fetch(`/api/activities/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(input),
  });

  return readJsonResponse<Activity>(response, 'Failed to update activity');
}

export async function deleteActivity(token: string, id: number): Promise<void> {
  const response = await fetch(`/api/activities/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  });

  if (!response.ok) {
    throw new ApiError('Failed to delete activity', response.status);
  }
}
