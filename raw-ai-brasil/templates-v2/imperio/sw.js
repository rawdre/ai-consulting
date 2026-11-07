/* Barbearia do Império — service worker (PWA). Cache leve do shell; agenda/admin sempre online. */
const CACHE = 'imperio-v1.4.0';
const SHELL = ['./', './index.html', './agenda.html', './config.js', './engine.js', './agenda.js', './agenda.css', './assets/logo.jpg', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;           // Supabase, CDNs, Waze: sempre rede
  if (/admin\.(html|js)$/.test(u.pathname)) return;                                   // admin nunca em cache
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
