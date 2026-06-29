import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';

import { EventsRepository } from './eventsRepository.ts';
import type { CreateEventInput, EventCategory, UpdateEventInput } from './eventTypes.ts';

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

function parseCategory(value: unknown): EventCategory {
  if (value === undefined || value === null || value === '') {
    return 'WHAT DOES';
  }

  if (value === 'WHAT DOES' || value === 'UPCOMING') {
    return value;
  }

  throw new Error('category must be WHAT DOES or UPCOMING');
}

function parseId(request: Request, response: Response): number | null {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Invalid event id' });
    return null;
  }

  return id;
}

function parseCreateInput(body: unknown): CreateEventInput {
  if (!isPlainObject(body)) {
    throw new Error('Request body must be an object');
  }

  return {
    title: requireText(body.title, 'title'),
    category: parseCategory(body.category),
    date: requireText(body.date, 'date'),
    description: textField(body.description),
    linkUrl: textField(body.linkUrl),
  };
}

function parseUpdateInput(body: unknown): UpdateEventInput {
  if (!isPlainObject(body)) {
    throw new Error('Request body must be an object');
  }

  const input: UpdateEventInput = {};
  if ('title' in body) {
    input.title = requireText(body.title, 'title');
  }
  if ('date' in body) {
    input.date = requireText(body.date, 'date');
  }
  if ('category' in body) {
    input.category = parseCategory(body.category);
  }
  if ('description' in body) {
    input.description = textField(body.description) ?? null;
  }
  if ('linkUrl' in body) {
    input.linkUrl = textField(body.linkUrl) ?? null;
  }

  return input;
}

export type EventsRouterOptions = {
  requireAdmin?: RequestHandler;
};

export function createEventsRouter(repository: EventsRepository, options: EventsRouterOptions = {}): Router {
  const router = Router();
  const requireAdmin: RequestHandler = options.requireAdmin || ((_request, _response, next) => next());

  router.get('/events', (_request, response) => {
    response.json(repository.list());
  });

  router.get('/events/:id', (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    const event = repository.findById(id);
    if (!event) {
      response.status(404).json({ error: 'Event not found' });
      return;
    }

    response.json(event);
  });

  router.post('/events', requireAdmin, (request, response) => {
    try {
      response.status(201).json(repository.create(parseCreateInput(request.body)));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  router.patch('/events/:id', requireAdmin, (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    try {
      const event = repository.update(id, parseUpdateInput(request.body));
      if (!event) {
        response.status(404).json({ error: 'Event not found' });
        return;
      }

      response.json(event);
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  router.delete('/events/:id', requireAdmin, (request, response) => {
    const id = parseId(request, response);
    if (id === null) {
      return;
    }

    if (!repository.delete(id)) {
      response.status(404).json({ error: 'Event not found' });
      return;
    }

    response.status(204).send();
  });

  return router;
}
