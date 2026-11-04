// DermaLens Offline Service Worker
// Strictly offline asset caching - Zero data transmission

const CACHE_NAME = 'dermalens-v1';
const STATIC_ASSETS = [
  '/',
  '/scan',
  '/disclaimer',
  '/manifest.webmanifest',
  '/icon.svg',
  '/wasm/vision_wasm_internal.wasm',
  '/wasm/vision_wasm_internal.js',
  '/models/face_landmarker.task',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Individual missing asset during initial dev run shouldn't break install
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strictly handle same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Cache-first for WASM and task model binaries
  if (url.pathname.startsWith('/wasm/') || url.pathname.startsWith('/models/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Network-first with cache fallback for pages and UI
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      }),
  );
});

