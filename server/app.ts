import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';

import { createAdminAuth } from './adminAuth.ts';
import { ActivitiesRepository } from './activitiesRepository.ts';
import { createActivitiesRouter } from './activitiesRoutes.ts';
import { createDatabase } from './db.ts';
import { EventsRepository } from './eventsRepository.ts';
import { createEventsRouter } from './eventsRoutes.ts';
import { syncUploadedActivities } from './uploadedActivities.ts';

export type AppOptions = {
  dbPath?: string;
  uploadRoot?: string;
};

const defaultUploadRoot = path.resolve(process.cwd(), 'server/uploads');

function isRequestEntityTooLarge(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'type' in error
    && (error as { type?: unknown }).type === 'entity.too.large';
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const database = createDatabase({ dbPath: options.dbPath });
  const uploadRoot = path.resolve(options.uploadRoot || process.env.UPLOAD_ROOT || defaultUploadRoot);
  const activitiesUploadRoot = path.join(uploadRoot, 'activities');
  const activitiesRepository = new ActivitiesRepository(database);
  const eventsRepository = new EventsRepository(database);
  const adminAuth = createAdminAuth();

  fs.mkdirSync(activitiesUploadRoot, { recursive: true });

  app.use(express.json({ limit: '35mb' }));
  app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (isRequestEntityTooLarge(error)) {
      response.status(413).json({ error: 'Request body too large' });
      return;
    }

    next(error);
  });
  app.use(
    '/uploads/activities',
    express.static(activitiesUploadRoot, {
      immutable: true,
      maxAge: '30d',
    }),
  );

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/admin', adminAuth.router);
  app.use(
    '/api',
    createActivitiesRouter(activitiesRepository, {
      activitiesUploadRoot,
      requireAdmin: adminAuth.requireAdmin,
      syncUploads: () => syncUploadedActivities(activitiesRepository, activitiesUploadRoot),
    }),
  );
  app.use('/api', createEventsRouter(eventsRepository, { requireAdmin: adminAuth.requireAdmin }));

  app.locals.database = database;

  return app;
}
