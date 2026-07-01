import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';

import { HackathonsRepository } from './hackathonsRepository.ts';
import type { CreateHackathonInput, HackathonImageFit, UpdateHackathonInput } from './hackathonTypes.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textField(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function nullableTextField(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return textField(value);
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }

  return value.trim();
}

function parseImageFit(value: unknown): HackathonImageFit {
  if (value === undefined || value === null || value === '') {
    return 'cover';
  }

  if (value === 'cover' || value === 'contain') {
    return value;
  }

  throw new Error('imageFit must be cover or contain');
}

function parseSortOrder(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const sortOrder = Number(value);
  if (!Number.isInteger(sortOrder)) {
    throw new Error('sortOrder must be an integer');
  }

  return sortOrder;
}

function parseId(request: Request, response: Response): number | null {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Invalid hackathon id' });
    return null;
  }

  return id;
}

function parseCreateInput(body: unknown): CreateHackathonInput {
  if (!isPlainObject(body)) {
    throw new Error('Request body must be an object');
  }

  return {
    label: requireText(body.label, 'label'),
    title: requireText(body.title, 'title'),
    meta: requireText(body.meta, 'meta'),
    imageUrl: textField(body.imageUrl) ?? null,
    imageFit: parseImageFit(body.imageFit),
    description: requireText(body.description, 'description'),
    linkUrl: textField(body.linkUrl) ?? null,
    sortOrder: parseSortOrder(body.sortOrder),
  };
}

function parseUpdateInput(body: unknown): UpdateHackathonInput {
  if (!isPlainObject(body)) {
    throw new Error('Request body must be an object');
  }

  const input: UpdateHackathonInput = {};
  if ('label' in body) {
    input.label = requireText(body.label, 'label');
  }
  if ('title' in body) {
    input.title = requireText(body.title, 'title');
  }
  if ('meta' in body) {
    input.meta = requireText(body.meta, 'meta');
  }
  if ('imageUrl' in body) {
    input.imageUrl = nullableTextField(body.imageUrl) ?? null;
  }
  if ('imageFit' in body) {
    input.imageFit = parseImageFit(body.imageFit);
  }
  if ('description' in body) {
    input.description = requireText(body.description, 'description');
  }
  if ('linkUrl' in body) {
    input.linkUrl = nullableTextField(body.linkUrl) ?? null;
  }
  if ('sortOrder' in body) {
    input.sortOrder = parseSortOrder(body.sortOrder) ?? 0;
  }

  return input;
}

export type HackathonsRouterOptions = {
  requireAdmin?: RequestHandler;
};

export function createHackathonsRouter(repository: HackathonsRepository, options: HackathonsRouterOptions = {}): Router {
  const router = Router();
  const requireAdmin: RequestHandler = options.requireAdmin || ((_request, _response, next) => next());

  router.get('/hackathons', (_request, response) => {
    response.json(repository.list());
  });

  router.get('/hackathons/:id', (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    const hackathon = repository.findById(id);
    if (!hackathon) {
      response.status(404).json({ error: 'Hackathon not found' });
      return;
    }

    response.json(hackathon);
  });

  router.post('/hackathons', requireAdmin, (request, response) => {
    try {
      response.status(201).json(repository.create(parseCreateInput(request.body)));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  router.patch('/hackathons/:id', requireAdmin, (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    try {
      const hackathon = repository.update(id, parseUpdateInput(request.body));
      if (!hackathon) {
        response.status(404).json({ error: 'Hackathon not found' });
        return;
      }

      response.json(hackathon);
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  router.delete('/hackathons/:id', requireAdmin, (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    if (!repository.delete(id)) {
      response.status(404).json({ error: 'Hackathon not found' });
      return;
    }

    response.status(204).send();
  });

  return router;
}
