const CACHE_NAME = 'bluecarbon-mrv-v1';
const STATIC_CACHE_NAME = 'bluecarbon-static-v1';
const DYNAMIC_CACHE_NAME = 'bluecarbon-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Files to cache on first access
const DYNAMIC_FILES = [
  '/dashboard',
  '/upload',
  '/registry',
  '/marketplace',
  '/gis-mapping',
  '/iot-simulation',
  '/wallet',
  '/admin'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external URLs
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          console.log('Serving from cache:', request.url);
          return response;
        }

        console.log('Fetching from network:', request.url);
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Determine cache name based on request type
            let cacheName = DYNAMIC_CACHE_NAME;
            if (STATIC_FILES.includes(url.pathname) || request.destination === 'script' || request.destination === 'style') {
              cacheName = STATIC_CACHE_NAME;
            }

            // Add to cache
            caches.open(cacheName)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Offline fallback
            if (request.destination === 'document') {
              return caches.match('/');
            }
            return new Response('Offline - Please check your internet connection', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync offline data when connection is restored
      syncOfflineData()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BlueCarbon MRV', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync offline data
async function syncOfflineData() {
  try {
    // Sync any pending uploads or data changes
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      await uploadOfflineData(offlineData);
      await clearOfflineData();
    }
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
}

// Helper functions for offline data management
async function getOfflineData() {
  // Get offline data from IndexedDB or localStorage
  return JSON.parse(localStorage.getItem('offlineData') || '[]');
}

async function uploadOfflineData(data) {
  // Upload offline data to server
  for (const item of data) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('Failed to sync item:', error);
    }
  }
}

async function clearOfflineData() {
  localStorage.removeItem('offlineData');
}