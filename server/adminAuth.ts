import crypto from 'node:crypto';

import { Router } from 'express';
import type { RequestHandler } from 'express';

const adminUsername = 'De-Butler';
const adminPassword = 'debutlerzzang';
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET || adminPassword;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function secureEqual(left: string, right: string): boolean {
  const leftHash = crypto.createHash('sha256').update(left).digest();
  const rightHash = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function signTokenPayload(payload: string): string {
  return crypto.createHmac('sha256', adminTokenSecret).update(payload).digest('base64url');
}

function createAdminToken(): string {
  const payload = Buffer.from(JSON.stringify({ username: adminUsername }), 'utf8').toString('base64url');
  return `${payload}.${signTokenPayload(payload)}`;
}

function isValidAdminToken(token: string): boolean {
  const [payload, signature] = token.split('.');
  if (!payload || !signature || token.split('.').length !== 2) {
    return false;
  }

  if (!secureEqual(signature, signTokenPayload(payload))) {
    return false;
  }

  try {
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { username?: unknown };
    return body.username === adminUsername;
  } catch {
    return false;
  }
}

export function createAdminAuth() {
  const router = Router();

  router.post('/login', (request, response) => {
    if (!isPlainObject(request.body)) {
      response.status(400).json({ error: 'Request body must be an object' });
      return;
    }

    const username = typeof request.body.username === 'string' ? request.body.username : '';
    const password = typeof request.body.password === 'string' ? request.body.password : '';

    if (!secureEqual(username, adminUsername) || !secureEqual(password, adminPassword)) {
      response.status(401).json({ error: 'Invalid admin credentials' });
      return;
    }

    response.json({ token: createAdminToken(), username: adminUsername });
  });

  const requireAdmin: RequestHandler = (request, response, next) => {
    const authorization = request.header('authorization') || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token || !isValidAdminToken(token)) {
      response.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    next();
  };

  return { router, requireAdmin };
}
