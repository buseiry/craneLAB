/**
 * CraneLab: ASVAM-Pulse - Progressive Web App Service Worker
 * TETFund - Tenstar Simulator Training Initiative
 * Consortium: ASQ Development & Training UK / SAMMAX Global Services
 *
 * Caching Policy: Cache-First Offline-Resilient Strategy with Background Synchronization
 */

// # State Block: Cache Architecture and Version Definition
const CACHE_NAME = 'cranelab-pulse-v1.5.0';
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
  './security_db.js',
  './inspection_gate.js',
  './crane_physics.js',
  './career_telemetry.js',
  './shutdown_reporting.js'
];

// # Function: Service Worker Install Event - Cache all local mission-critical assets
self.addEventListener('install', (event) => {
  // # State Block: Enforce immediate activation without waiting for active clients to disconnect
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // # State Block: Pre-caching static assets for complete offline airplane-mode support
      console.log('[CraneLab-SW] Pre-caching static bundle for 100% offline flight resilience');
      return cache.addAll(CRITICAL_ASSETS);
    }).catch((err) => {
      console.error('[CraneLab-SW] Pre-caching encountered an exception:', err);
    })
  );
});

// # Function: Service Worker Activate Event - Purge stale cache generations
self.addEventListener('activate', (event) => {
  // # State Block: Claim existing browser clients immediately on activation
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            // # Equation: Cache key invalidation rule: Delete all caches where cache !== current CACHE_NAME
            if (cache !== CACHE_NAME) {
              console.log('[CraneLab-SW] Deleting obsolete cache bucket:', cache);
              return caches.delete(cache);
            }
            return null;
          })
        );
      })
    ])
  );
});

// # Function: Service Worker Fetch Event - Cache-First routing with network fallback
self.addEventListener('fetch', (event) => {
  // # State Block: Discard non-HTTP/HTTPS schemes (e.g. chrome-extension or chrome data)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // # State Block: Route handling via Cache-First strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // # Condition 1: Asset exists in local cache bucket
      if (cachedResponse) {
        // # Background Math/Telemetry Block: Update cache asynchronously if online
        if (navigator.onLine && event.request.method === 'GET') {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {
            // # State Block: Silent catch for network drops during background refresh
          });
        }
        return cachedResponse;
      }

      // # Condition 2: Asset not in cache - Query live network and dynamically cache
      return fetch(event.request).then((networkResponse) => {
        // # State Block: Validate legitimate response before cloning
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // # State Block: Only cache GET requests
          if (event.request.method === 'GET') {
            cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch((fetchErr) => {
        // # Condition 3: Offline fallback for page navigation requests
        if (event.request.mode === 'navigate') {
          console.log('[CraneLab-SW] Airplane mode: Serving cached offline index.html shell');
          return caches.match('./index.html');
        }
        throw fetchErr;
      });
    })
  );
});

// # Function: Message event listener for client-to-worker synchronization triggers
self.addEventListener('message', (event) => {
  // # State Block: Handle force cache update or version interrogation
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

