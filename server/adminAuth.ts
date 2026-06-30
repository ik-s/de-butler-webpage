import crypto from 'node:crypto';

import { Router } from 'express';
import type { RequestHandler } from 'express';

type AdminAuthOptions = {
  username?: string;
  password?: string;
  tokenSecret?: string;
  tokenTtlSeconds?: number;
  now?: () => number;
  allowInsecureDefaults?: boolean;
};

type AdminAuthConfig = {
  username: string;
  password: string;
  tokenSecret: string;
  tokenTtlSeconds: number;
  now: () => number;
};

const defaultAdminUsername = 'De-Butler';
const defaultAdminPassword = 'debutlerzzang';
const defaultTokenTtlSeconds = 8 * 60 * 60;
const minProductionSecretLength = 32;
const fallbackAdminTokenSecret = crypto.randomBytes(32).toString('base64url');

function nonEmpty(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function parseTokenTtlSeconds(value: string | undefined): number {
  if (!value) {
    return defaultTokenTtlSeconds;
  }

  const ttl = Number(value);
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error('ADMIN_SESSION_TTL_SECONDS must be a positive integer');
  }

  return ttl;
}

function resolveAdminAuthConfig(options: AdminAuthOptions = {}): AdminAuthConfig {
  const envPassword = nonEmpty(process.env.ADMIN_PASSWORD);
  const envSecret = nonEmpty(process.env.ADMIN_TOKEN_SECRET);
  const username = options.username ?? nonEmpty(process.env.ADMIN_USERNAME) ?? defaultAdminUsername;
  const password = options.password ?? envPassword ?? defaultAdminPassword;
  const tokenSecret = options.tokenSecret ?? envSecret ?? fallbackAdminTokenSecret;
  const tokenTtlSeconds = options.tokenTtlSeconds ?? parseTokenTtlSeconds(process.env.ADMIN_SESSION_TTL_SECONDS);

  if (process.env.NODE_ENV === 'production' && !options.allowInsecureDefaults) {
    if (!options.password && !envPassword) {
      throw new Error('ADMIN_PASSWORD must be configured in production');
    }
    if (password === defaultAdminPassword) {
      throw new Error('ADMIN_PASSWORD must not use the development default in production');
    }
    if (!options.tokenSecret && !envSecret) {
      throw new Error('ADMIN_TOKEN_SECRET must be configured in production');
    }
    if (tokenSecret.length < minProductionSecretLength) {
      throw new Error(`ADMIN_TOKEN_SECRET must be at least ${minProductionSecretLength} characters in production`);
    }
  }

  return {
    username,
    password,
    tokenSecret,
    tokenTtlSeconds,
    now: options.now ?? Date.now,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function secureEqual(left: string, right: string): boolean {
  const leftHash = crypto.createHash('sha256').update(left).digest();
  const rightHash = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function nowSeconds(config: AdminAuthConfig): number {
  return Math.floor(config.now() / 1000);
}

function signTokenPayload(payload: string, config: AdminAuthConfig): string {
  return crypto.createHmac('sha256', config.tokenSecret).update(payload).digest('base64url');
}

function createAdminToken(config: AdminAuthConfig): string {
  const issuedAt = nowSeconds(config);
  const payload = Buffer.from(
    JSON.stringify({
      username: config.username,
      iat: issuedAt,
      exp: issuedAt + config.tokenTtlSeconds,
    }),
    'utf8',
  ).toString('base64url');

  return `${payload}.${signTokenPayload(payload, config)}`;
}

function isValidAdminToken(token: string, config: AdminAuthConfig): boolean {
  const [payload, signature] = token.split('.');
  if (!payload || !signature || token.split('.').length !== 2) {
    return false;
  }

  if (!secureEqual(signature, signTokenPayload(payload, config))) {
    return false;
  }

  try {
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      username?: unknown;
      exp?: unknown;
    };
    return body.username === config.username
      && typeof body.exp === 'number'
      && Number.isInteger(body.exp)
      && body.exp > nowSeconds(config);
  } catch {
    return false;
  }
}

export function createAdminAuth(options: AdminAuthOptions = {}) {
  const config = resolveAdminAuthConfig(options);
  const router = Router();

  router.post('/login', (request, response) => {
    if (!isPlainObject(request.body)) {
      response.status(400).json({ error: 'Request body must be an object' });
      return;
    }

    const username = typeof request.body.username === 'string' ? request.body.username : '';
    const password = typeof request.body.password === 'string' ? request.body.password : '';

    if (!secureEqual(username, config.username) || !secureEqual(password, config.password)) {
      response.status(401).json({ error: 'Invalid admin credentials' });
      return;
    }

    response.json({ token: createAdminToken(config), username: config.username });
  });

  const requireAdmin: RequestHandler = (request, response, next) => {
    const authorization = request.header('authorization') || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token || !isValidAdminToken(token, config)) {
      response.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    next();
  };

  return { router, requireAdmin };
}
