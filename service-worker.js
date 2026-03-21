// GP Sakhi — Service Worker
// Version: बदलल्यावर cache clear होतो
const CACHE_VERSION = 'gp-sakhi-v1';

// ══ Cache मध्ये काय ठेवायचे ══
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/profile.html',
  '/voucher.html',
  '/letter.html',
  '/tharav.html',
  '/namuna8.html',
  '/config.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Google Fonts — Offline साठी cache होतील
const FONT_CACHE = 'gp-sakhi-fonts-v1';
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Marathi:ital@0;1&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap',
  'https://fonts.gstatic.com'
];

// ══ INSTALL — Static files cache करा ══
self.addEventListener('install', (event) => {
  console.log('[SW] Installing GP Sakhi Service Worker...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Static assets cache करत आहे...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Install complete!');
      return self.skipWaiting();
    }).catch((err) => {
      console.error('[SW] Install error:', err);
    })
  );
});

// ══ ACTIVATE — जुने cache हटवा ══
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== FONT_CACHE)
          .map((name) => {
            console.log('[SW] जुना cache हटवत आहे:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ══ FETCH — Request interceptor ══
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Firebase requests — नेहमी network वापरा (offline असल्यास fail होऊ दे)
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('firestore') ||
      url.hostname.includes('googleapis.com') && url.pathname.includes('identitytoolkit')) {
    event.respondWith(fetch(event.request).catch(() => {
      // Firebase offline असेल तर graceful fail
      return new Response(JSON.stringify({ error: 'offline' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // Google Fonts — Cache first, then network
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached); // Offline असेल तर cached font वापरा
        });
      })
    );
    return;
  }

  // App pages — Cache first, then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Background मध्ये update करा
        fetch(event.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      // Cache मध्ये नाही — network वापरा
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // पूर्ण offline — offline page दाखवा
        if (event.request.mode === 'navigate') {
          return caches.match('/dashboard.html');
        }
      });
    })
  );
});

// ══ MESSAGE — Manual cache update ══
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
