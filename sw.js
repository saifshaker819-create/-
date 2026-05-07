/* Service Worker — كلية طب الأسنان
 * يفعّل تثبيت PWA + تخزين مؤقت ذكي للملفات الأساسية
 */
const CACHE = 'dental-v1.0.0';

// الملفات الأساسية اللي تنخزن أول مرة
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// التثبيت — خزن الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      })
    )
  );
});

// التفعيل — احذف الكاشات القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// استراتيجية: Network-first للـ HTML (لتحديثات فورية)، Cache-first للباقي
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // طلبات GET فقط
  if (req.method !== 'GET') return;

  // تجاهل طلبات Firebase / API الديناميكية
  const url = new URL(req.url);
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com')
  ) {
    return; // خلّ المتصفح يدير هاي بنفسه
  }

  // HTML: network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // باقي الأصول: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // خزن النسخة الجديدة (إذا كانت ناجحة وبنفس الأصل)
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
    })
  );
});
