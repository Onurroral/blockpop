const CACHE_NAME = 'blockpop-v1';

// Cache'lenecek dosyalar
const ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/manifest.json',
  '/assets/sounds/place.mp3',
  '/assets/sounds/clear.mp3',
  '/assets/sounds/combo.mp3',
  '/assets/sounds/gameover.mp3',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

// Kurulum: tüm dosyaları cache'e al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Bazı dosyalar cache\'lenemedi:', err);
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

// Fetch: önce cache'e bak, yoksa internetten al
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Başarılı response'u cache'e ekle
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // İnternet yoksa ve cache'de de yoksa index.html dön
        return caches.match('/index.html');
      });
    })
  );
});
