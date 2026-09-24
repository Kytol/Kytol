/* Installed-SPA shell cache.
 * The file keeps its old name so an already-registered worker updates in place.
 * Sneak-peek stores the demo in sessionStorage and has no Firebase project,
 * so this worker does not importScripts Firebase. Those scripts used to block
 * the first navigation (Chrome splash) for a couple of seconds. */
const SPA_SHELL_CACHE = 'zzz-spa-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/fonts/inter-latin-wght.woff2',
  '/favicon_t_192.png',
  '/favicon_t_512.png',
];

function shellCacheEnabled() {
  const host = self.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1' && host !== '[::1]';
}

function sameOriginUrl(raw, fallbackPath) {
  const fallback = new URL(fallbackPath || '/', self.location.origin);
  try {
    const target = new URL(raw || fallbackPath || '/', self.location.origin);
    return target.origin === self.location.origin ? target.href : fallback.href;
  } catch {
    return fallback.href;
  }
}

function bypassSpaCache(request) {
  if (request.method !== 'GET') {
    return true;
  }
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return true;
  }
  if (url.origin !== self.location.origin) {
    return true;
  }
  const path = url.pathname;
  return (
    path.endsWith('/version.json') ||
    path.endsWith('/firebase-messaging-sw.js') ||
    path.startsWith('/api/') ||
    path === '/api'
  );
}

async function matchSpa(cache, request) {
  const exact = await cache.match(request, { ignoreSearch: true });
  if (exact) {
    return exact;
  }
  if (request.mode === 'navigate') {
    return (await cache.match('/index.html')) || (await cache.match('/'));
  }
  return undefined;
}

function putIfCacheable(cache, request, response) {
  if (!response || !response.ok || response.status !== 200 || response.type !== 'basic') {
    return;
  }
  return cache.put(request, response.clone());
}

async function refreshSpa(cache, request) {
  try {
    const response = await fetch(request);
    await putIfCacheable(cache, request, response);
    return response;
  } catch {
    return undefined;
  }
}

async function spaCacheFirst(request) {
  const cache = await caches.open(SPA_SHELL_CACHE);
  const cached = await matchSpa(cache, request);
  if (cached) {
    void refreshSpa(cache, request);
    return cached;
  }
  try {
    const response = await fetch(request);
    await putIfCacheable(cache, request, response);
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }
}

async function precacheShell() {
  const cache = await caches.open(SPA_SHELL_CACHE);
  await Promise.all(
    PRECACHE_URLS.map(async (url) => {
      try {
        const response = await fetch(url);
        await putIfCacheable(cache, new Request(url), response);
      } catch {
        /* optional icon / font */
      }
    }),
  );
}

async function dropOldSpaCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith('zzz-spa-') && key !== SPA_SHELL_CACHE)
      .map((key) => caches.delete(key)),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      if (shellCacheEnabled()) {
        await precacheShell();
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await dropOldSpaCaches();
      await self.clients.claim();
    })(),
  );
});

/* Cache-first same-origin GET so a published SPA paints from disk.
 * No fetch listener on localhost: a listener that does not answer still makes
 * Chrome report "The FetchEvent resulted in a network error response: the
 * promise was rejected" when ng serve drops or aborts the navigation. */
if (shellCacheEnabled()) {
  self.addEventListener('fetch', (event) => {
    if (bypassSpaCache(event.request)) {
      return;
    }
    event.respondWith(
      spaCacheFirst(event.request).catch(
        () => new Response('', { status: 504, statusText: 'Gateway Timeout' }),
      ),
    );
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'zzz-clear-spa-cache') {
    event.waitUntil(caches.delete(SPA_SHELL_CACHE));
    return;
  }
  if (event.data && event.data.type === 'zzz-open-spa') {
    const target = sameOriginUrl(event.data.url || '/', '/');
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
        for (const client of list) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus().then((opened) => {
              if (opened && 'navigate' in opened) {
                return opened.navigate(target);
              }
              return opened;
            });
          }
        }
        return self.clients.openWindow(target);
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = sameOriginUrl(event.notification.data?.url, '/');
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((opened) => {
            if (opened && 'navigate' in opened) {
              return opened.navigate(url);
            }
            return opened;
          });
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
