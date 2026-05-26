// Service Worker — Web Push notifications for Брашов Українські
const APP_BASE = '/brasov-ukrainian-app';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = { title: 'Брашов Українські', body: '', url: APP_BASE + '/' };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: APP_BASE + '/icon-192.png',
      badge: APP_BASE + '/badge-72.png',
      tag: 'brasov-ua',
      renotify: true,
      data: { url: data.url },
      actions: [{ action: 'open', title: 'Відкрити' }],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || APP_BASE + '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(APP_BASE) && 'focus' in client) {
            client.postMessage({ type: 'navigate', url });
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
