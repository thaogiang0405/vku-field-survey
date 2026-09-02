const CACHE_VERSION = 'vku-field-survey-v1';
const RUNTIME_CACHE = 'vku-field-survey-runtime-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

declare const self: ServiceWorkerGlobalScope;

// Install event - cache app shell
self.addEventListener('install', (event: any) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.warn('[SW] Some assets failed to cache (this is normal for development):', error);
        // Don't fail on icon missing errors
      });
    })
  );
  (self as any).skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event: any) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  (self as any).clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests differently
  if (url.pathname.includes('/api/')) {
    // Network-first for API, but don't cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          return response;
        })
        .catch((error) => {
          console.log('[SW] API request failed (expected when offline):', error);
          // Return a placeholder response for offline API calls
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Offline - request will be retried when online',
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // Cache-first strategy for app shell and static assets
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then((response) => {
          // Don't cache if not a successful response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache CSS, JS, images
          const contentType = response.headers.get('content-type');
          if (
            contentType &&
            (contentType.includes('text/css') ||
              contentType.includes('application/javascript') ||
              contentType.includes('image/') ||
              contentType.includes('font/'))
          ) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html') || 
              new Response('Offline - App shell not available', {
                status: 503,
                statusText: 'Service Unavailable',
              });
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

export {};
