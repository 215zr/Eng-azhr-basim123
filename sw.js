// sw.js — Service Worker (Network-First للـ HTML)
// ملاحظة: غيّر الرقم v3 عند كل تعديل جديد على الكود
const C = 'azhar-v3';
const A = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(c => c.addAll(A).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== C).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Network-First للـ HTML — يجلب أحدث نسخة
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(C).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // Cache-First لباقي الملفات
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(C).then(c => c.put(req, clone));
          }
          return res;
        });
      })
    );
  }
});
