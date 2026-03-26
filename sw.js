const CACHE_NAME = 'dental-absences-v2';
const ASSETS = [
  './manifest.json'
  // index.html لا يُخزَّن في الكاش حتى يُحمَّل دائماً أحدث نسخة
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
  const url = new URL(e.request.url);

  // index.html → دائماً من السيرفر، لا كاش أبداً
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // باقي الملفات → حاول السيرفر أولاً، وعند انقطاع النت استخدم الكاش
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
