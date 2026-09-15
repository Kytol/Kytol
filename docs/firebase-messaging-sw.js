/* Firebase Cloud Messaging background handler. Config is stored in Cache by the app. */
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');

async function firebaseConfig() {
  const cache = await caches.open('zzz-fcm-config');
  const res = await cache.match('/zzz-fcm-config');
  if (!res) {
    throw new Error('missing fcm config');
  }
  return res.json();
}

async function ensureMessaging() {
  if (!firebase.apps.length) {
    firebase.initializeApp(await firebaseConfig());
  }
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'Team Space';
    const body = payload.notification?.body || payload.data?.body || '';
    const url = payload.data?.url || '/app/groups';
    return self.registration.showNotification(title, { body, data: { url } });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await ensureMessaging().catch(() => undefined);
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'zzz-fcm-init') {
    event.waitUntil(ensureMessaging().catch(() => undefined));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/app/groups', self.location.origin).href;
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
