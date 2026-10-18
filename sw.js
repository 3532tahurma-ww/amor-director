/*
 * Amor Director - Service worker (çevrimdışı çalışma)
 * Uygulama dosyaları kurulumda önbelleğe alınır; açılışta önbellekten gelir,
 * arka planda güncellenir (stale-while-revalidate).
 * Yeni sürüm yayınlarken VERSION'ı artır, eski önbellek silinir.
 */
const VERSION = 'amor-director-v8';
const CORE = [
  './', './index.html', './manifest.json', './css/style.css',
  './js/store.js', './js/figure.js', './js/places.js', './js/texts.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin || url.host.endsWith('googleapis.com') || url.host.endsWith('gstatic.com')) {
    e.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? cache.match('./index.html') : undefined));
      return hit || net;
    }));
  }
});
