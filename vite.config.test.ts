import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';

import configFactory from './vite.config.ts';

describe('vite dev proxy', () => {
  test('proxies uploaded activity images to the backend server', () => {
    const config = configFactory({ mode: 'development', command: 'serve' });
    const proxy = config.server?.proxy;
    const uploadsProxy = typeof proxy?.['/uploads'] === 'object' ? proxy['/uploads'] : undefined;

    assert.equal(typeof proxy, 'object');
    assert.equal(uploadsProxy?.target, 'http://localhost:3001');
    assert.equal(uploadsProxy?.changeOrigin, true);
  });

  test('serves the favicon referenced by index.html from public assets', () => {
    const html = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const faviconHref = html.match(/<link\s+[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1];

    assert.equal(faviconHref, '/favicon.ico?v=1');
    assert.equal(existsSync(path.join(process.cwd(), 'public', 'favicon.ico')), true);
  });
});
