const CACHE_NAME = 'dental-absences-v3';
const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // امسح كل الكاشات القديمة
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // استراتيجية: Network First → إذا يوجد نت حمّل من السيرفر وحدّث الكاش
  //                              إذا لا يوجد نت استخدم الكاش
  e.respondWith(
    fetch(e.request)
      .then(function(networkResponse) {
        // يوجد نت → حدّث الكاش بالنسخة الجديدة
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(function() {
        // لا يوجد نت → استخدم الكاش
        return caches.match(e.request);
      })
  );
});
