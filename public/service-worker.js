/**
 * Till Rwanda POS Service Worker
 * Handles offline functionality, asset caching, and background sync
 */

const CACHE_NAME = 'till-rwanda-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.css',
  '/src/index.css',
];

const API_CACHE = 'till-rwanda-api-v1';
const IMAGE_CACHE = 'till-rwanda-images-v1';

// Cache size limits
const CACHE_LIMITS = {
  api: 50,
  images: 30,
  static: 10,
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('[Service Worker] Error caching assets:', error);
      });
    })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event - implement caching strategy
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external APIs
  if (request.method !== 'GET' || url.hostname !== self.location.hostname) {
    return;
  }

  // Route based on request type
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    // Image files - network first, fallback to cache
    event.respondWith(networkFirstStrategy(request, IMAGE_CACHE));
  } else if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    // API calls - network first with cache fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else {
    // HTML, JS, CSS - cache first, fallback to network
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  }
});

/**
 * Cache first strategy - try cache, fallback to network
 */
async function cacheFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[Service Worker] Cache hit:', request.url);
      return cached;
    }

    const response = await fetch(request);
    if (!response || response.status !== 200 || response.type === 'error') {
      return response;
    }

    // Clone and cache the response
    const responseToCache = response.clone();
    const cache = await caches.open(cacheName);
    cache.put(request, responseToCache);

    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch error:', error);
    // Return offline page or error response
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

/**
 * Network first strategy - try network, fallback to cache
 */
async function networkFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request);

    if (!response || response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Clone and cache the response
    const responseToCache = response.clone();
    const cache = await caches.open(cacheName);
    cache.put(request, responseToCache);

    // Enforce cache size limits
    trimCache(cacheName, CACHE_LIMITS.api);

    return response;
  } catch (error) {
    console.log('[Service Worker] Network request failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

/**
 * Trim cache to size limit
 */
async function trimCache(cacheName: string, limit: number): Promise<void> {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > limit) {
    const keysToDelete = keys.slice(0, keys.length - limit);
    for (const key of keysToDelete) {
      await cache.delete(key);
    }
  }
}

/**
 * Background sync for offline sales
 */
self.addEventListener('sync', (event: any) => {
  console.log('[Service Worker] Background sync event:', event.tag);

  if (event.tag === 'sync-offline-sales') {
    event.waitUntil(syncOfflineSales());
  }
});

/**
 * Sync offline sales data with server
 */
async function syncOfflineSales(): Promise<void> {
  try {
    console.log('[Service Worker] Syncing offline sales...');
    // This will be handled by the app's offline service
    // Send message to all clients to trigger sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_OFFLINE_SALES',
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

/**
 * Handle push notifications
 */
self.addEventListener('push', (event: any) => {
  console.log('[Service Worker] Push notification received');

  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Till Rwanda POS',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: data.tag || 'till-rwanda-notification',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Till Rwanda', options));
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event: any) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if window already exists
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return (client as any).focus();
        }
      }
      // Open new window if not found
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

console.log('[Service Worker] Script loaded and ready');
