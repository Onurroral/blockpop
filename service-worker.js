const CACHE_NAME = 'blockpop-v2';
const BASE = '/blockpop';

const ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/main.js`,
  `${BASE}/style.css`,
  `${BASE}/manifest.json`,
  `${BASE}/assets/sounds/place.mp3`,
  `${BASE}/assets/sounds/clear.mp3`,
  `${BASE}/assets/sounds/combo.mp3`,
  `${BASE}/assets/sounds/gameover.mp3`,
  `${BASE}/assets/icons/icon-192.png`,
  `${BASE}/assets/icons/icon-512.png`,
];

// Kurulum
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Bazı dosyalar cachelenemedi:', err);
      });
    })
  );
  self.skipWaiting();
});

// Aktivasyon: eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: önce cache'e bak
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(`${BASE}/index.html`);
      });
    })
  );
});
