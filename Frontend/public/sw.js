const CACHE_NAME = 'talent-graph-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never intercept API routes, Next.js internals, or Firebase/Firestore traffic.
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/')) return;
  if (url.hostname.includes('firestore.googleapis.com')) return;
  if (url.hostname.includes('firebase')) return;
  if (url.hostname.includes('googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful, non-opaque responses.
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        // Fetch failed (offline or network error) — try the cache first.
        caches.match(event.request).then((cached) => {
          if (cached) return cached;

          // For navigation requests, serve the cached shell so the app can
          // display its own offline/error UI rather than a blank browser page.
          if (event.request.mode === 'navigate') {
            return caches.match('/').then(
              (shell) =>
                shell ||
                new Response(
                  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#080818;color:#fff"><div style="text-align:center"><h2>No connection</h2><p style="color:#888">Check your network and try again.</p><button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;background:#00d4aa;border:none;border-radius:8px;font-weight:700;cursor:pointer;color:#000">Retry</button></div></body></html>',
                  { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                )
            );
          }

          // For all other resources (images, fonts, etc.) return a proper error
          // response — never return undefined, which throws TypeError.
          return Response.error();
        })
      )
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Talent Graph', body: event.data.text() };
  }

  const { title = 'Talent Graph Kenya', body = '', icon, badge, url, tag } = payload;

  const options = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/icon-72x72.png',
    tag: tag || 'tg-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: url || '/club-dashboard' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/club-dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
