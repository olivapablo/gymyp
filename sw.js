const CACHE_NAME = 'fittrack-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/screens.css',
  './css/dashboard.css',
  './js/app.js',
  './js/auth.js',
  './js/theme.js',
  './js/router.js',
  './js/firebase-config.js',
  './js/db/profiles.js',
  './js/db/routines.js',
  './js/db/workouts.js',
  './js/screens/dashboard.js',
  './js/screens/routines.js',
  './js/screens/workout.js',
  './js/screens/history.js',
  './js/screens/progress.js',
  './js/screens/profile.js',
  './js/screens/onboarding.js',
  './js/utils/dialog.js',
  './js/utils/audio.js',
  './js/utils/notifications.js',
  './js/utils/notifications-scheduler.js',
  './js/utils/offline-queue.js',
  './js/utils/pwa-install.js',
  './assets/icon.svg',
  './assets/logo.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

// ── Install: cache all app-shell assets ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell (v3)');
      // Use individual puts so one failure doesn't block everything
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Could not cache:', url, err)
          )
        )
      );
    })
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ──────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing stale cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch strategy ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // External CDN (Firebase, Lucide, Fonts) → Network Only, no caching
  const externalHosts = [
    'firebasestorage.googleapis.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'unpkg.com',
    'www.gstatic.com',
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com'
  ];
  if (externalHosts.some(h => url.hostname.includes(h))) {
    return; // Let browser handle normally
  }

  // Static assets (CSS, JS, SVG, PNG) → Cache First, update in background
  const isStaticAsset = /\.(css|js|svg|png|jpg|jpeg|webp|woff2?)$/.test(url.pathname);
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((networkRes) => {
          if (networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return networkRes;
        }).catch(() => null);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // HTML / navigation → Network First, fall back to cached index.html
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match('./index.html'))
  );
});

// ── Push Notification Event ──────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'FITTRACK',
    body: '¡Es hora de entrenar hoy! Supera tus límites.',
    icon: './assets/icon.svg'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FITTRACK', {
      body:    data.body,
      icon:    data.icon || './assets/icon.svg',
      badge:   './assets/icons/icon-192.png',
      vibrate: [100, 50, 100],
      data:    { url: data.url || './' }
    })
  );
});

// ── Notification Click ───────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
