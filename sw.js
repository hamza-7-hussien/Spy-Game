// Spy Station service worker
// Bump this whenever you want to force everyone onto a fresh cache after a
// deploy (not strictly required - stale-while-revalidate below already
// refreshes the cache in the background on every load, but bumping it
// guarantees an immediate, clean cutover).
const CACHE_NAME = 'spy-station-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate, same-origin GET requests only. Firebase's own
// traffic (realtime database websockets, auth calls to googleapis.com,
// the SDK scripts on gstatic.com, Google fonts, dicebear avatars, etc.)
// is cross-origin and is left completely untouched, so gameplay data and
// auth are never served from a stale cache.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// Lets the page (optionally) tell a waiting worker to activate immediately
// instead of waiting for every open tab to close.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});