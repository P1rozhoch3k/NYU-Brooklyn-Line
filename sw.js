// Minimal service worker: caches the app shell so the installed app
// opens instantly and works offline. Static personal app — no backend
// to talk to, so a simple stale-while-revalidate is enough.

const CACHE_NAME = 'brooklyn-line-v1';
const APP_SHELL = [
  './',
  'index.html',
  'css/styles.css',
  'js/data.js',
  'js/storage.js',
  'js/ics.js',
  'js/notify.js',
  'js/quickadd.js',
  'js/app.js',
  'manifest.webmanifest',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/bg-lines.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
