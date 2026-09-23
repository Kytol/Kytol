import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sw = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'firebase-messaging-sw.js'), 'utf8');

describe('firebase-messaging-sw', () => {
  it('does not import Firebase before it can answer the first navigation', () => {
    const calls = sw.split('\n').filter((line) => /^\s*importScripts\s*\(/.test(line));
    expect(calls).toEqual([]);
    expect(sw).not.toContain('gstatic.com');
    expect(sw).not.toContain('firebase.initializeApp');
  });

  it('serves the downloaded SPA from the disk cache, except on localhost', () => {
    expect(sw).toContain("const SPA_SHELL_CACHE = 'zzz-spa-v1'");
    expect(sw).toContain('spaCacheFirst');
    expect(sw).toContain('bypassSpaCache');
    expect(sw).toContain('shellCacheEnabled');
    expect(sw).toContain("host !== 'localhost'");
  });
});
