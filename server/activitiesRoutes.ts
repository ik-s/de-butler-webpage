import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';

import { ActivitiesRepository } from './activitiesRepository.ts';
import type { CreateActivityInput, UpdateActivityInput } from './activityTypes.ts';

const activityImagePrefix = '/uploads/activities/';

type ActivitiesRouterOptions = {
  activitiesUploadRoot?: string;
  requireAdmin?: RequestHandler;
  syncUploads?: () => void;
};

const uploadMimeExtensions = new Map([
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textField(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }

  return value.trim();
}

function sortOrderField(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error('sortOrder must be an integer');
  }

  return value;
}

function activityImageUrlField(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !value.startsWith(activityImagePrefix)) {
    throw new Error('imageUrl must start with /uploads/activities/');
  }

  const relativePath = value.slice(activityImagePrefix.length);
  if (relativePath.length === 0 || relativePath.includes('..') || relativePath.includes('\\')) {
    throw new Error('imageUrl must stay within /uploads/activities/');
  }

  return value.trim();
}

function requireUploadRoot(uploadRoot: string | undefined): string {
  if (!uploadRoot) {
    throw new Error('Activity upload root is not configured');
  }

  return uploadRoot;
}

function safeUploadBaseName(fileName: unknown): string {
  const rawName = typeof fileName === 'string' ? path.basename(fileName, path.extname(fileName)) : 'activity';
  const safeName = rawName
    .replace(/[^a-zA-Z0-9가-힣._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 70);

  return safeName || 'activity';
}

function parseImageUpload(body: unknown): { fileName: string; bytes: Buffer } {
  if (!isPlainObject(body)) {
    throw new Error('Request body must be an object');
  }

  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
  const extension = uploadMimeExtensions.get(mimeType);
  if (!extension) {
    throw new Error('mimeType must be a supported image type');
  }

  if (typeof body.dataBase64 !== 'string' || body.dataBase64.length === 0) {
    throw new Error('dataBase64 is required');
  }

  const bytes = Buffer.from(body.dataBase64, 'base64');
  if (bytes.length === 0) {
    throw new Error('image data is empty');
  }

  const fileName = `${safeUploadBaseName(body.fileName)}-${crypto.randomBytes(4).toString('hex')}${extension}`;
  return { fileName, bytes };
}

function deleteActivityUpload(imageUrl: string | null, uploadRoot: string | undefined): void {
  if (!imageUrl || !imageUrl.startsWith(activityImagePrefix) || !uploadRoot) {
    return;
  }

  const fileName = decodeURIComponent(imageUrl.slice(activityImagePrefix.length));
  if (!fileName || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    return;
  }

  fs.rmSync(path.join(uploadRoot, fileName), { force: true });
}

function parseId(request: Request, response: Response): number | null {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Invalid activity id' });
    return null;
  }

  return id;
}

function parseCreateInput(body: unknown): CreateActivityInput {
  if (!isPlainObject(body)) {
    throw new Error('Request body must be an object');
  }

  return {
    title: requireText(body.title, 'title'),
    category: textField(body.category),
    date: requireText(body.date, 'date'),
    description: textField(body.description),
    imageUrl: activityImageUrlField(body.imageUrl),
    sortOrder: sortOrderField(body.sortOrder),
  };
}

function parseUpdateInput(body: unknown): UpdateActivityInput {
  if (!isPlainObject(body)) {
    throw new Error('Request body must be an object');
  }

  const input: UpdateActivityInput = {};
  if ('title' in body) {
    input.title = requireText(body.title, 'title');
  }
  if ('category' in body) {
    input.category = textField(body.category) ?? null;
  }
  if ('date' in body) {
    input.date = requireText(body.date, 'date');
  }
  if ('description' in body) {
    input.description = textField(body.description) ?? null;
  }
  if ('imageUrl' in body) {
    input.imageUrl = activityImageUrlField(body.imageUrl);
  }
  if ('sortOrder' in body) {
    input.sortOrder = sortOrderField(body.sortOrder);
  }

  return input;
}

export function createActivitiesRouter(repository: ActivitiesRepository, options: ActivitiesRouterOptions = {}): Router {
  const router = Router();
  const requireAdmin: RequestHandler = options.requireAdmin || ((_request, _response, next) => next());

  router.get('/activities', (_request, response) => {
    options.syncUploads?.();
    response.json(repository.list());
  });

  router.post('/activities/images', requireAdmin, (request, response) => {
    try {
      const uploadRoot = requireUploadRoot(options.activitiesUploadRoot);
      fs.mkdirSync(uploadRoot, { recursive: true });

      const upload = parseImageUpload(request.body);
      fs.writeFileSync(path.join(uploadRoot, upload.fileName), upload.bytes);

      response.status(201).json({ imageUrl: `${activityImagePrefix}${upload.fileName}` });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  router.get('/activities/:id', (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    const activity = repository.findById(id);
    if (!activity) {
      response.status(404).json({ error: 'Activity not found' });
      return;
    }

    response.json(activity);
  });

  router.post('/activities', requireAdmin, (request, response) => {
    try {
      response.status(201).json(repository.create(parseCreateInput(request.body)));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  router.patch('/activities/:id', requireAdmin, (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    try {
      const activity = repository.update(id, parseUpdateInput(request.body));
      if (!activity) {
        response.status(404).json({ error: 'Activity not found' });
        return;
      }

      response.json(activity);
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  router.delete('/activities/:id', requireAdmin, (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    const activity = repository.findById(id);
    if (!activity) {
      response.status(404).json({ error: 'Activity not found' });
      return;
    }

    repository.delete(id);
    deleteActivityUpload(activity.imageUrl, options.activitiesUploadRoot);
    response.status(204).send();
  });

  return router;
}
