import assert from 'node:assert/strict';
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
});
