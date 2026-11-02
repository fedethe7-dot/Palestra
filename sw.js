/* Service worker di Palestra
   - file dell'app: prima la rete (vedi sempre l'ultima versione), la copia salvata se sei offline
   - foto dei piatti e caratteri: salvati la prima volta e poi presi dalla copia (funzionano offline) */
const VER = '6.2.0';
const BASE = self.registration.scope.includes('/beta/') ? 'palestra-beta-' : 'palestra-';
const CACHE = BASE + VER, CACHE_EXTRA = 'palestra-extra';
const FILES = ['./', './index.html', './manifest.json', './ricette.csv', './icon-192.png', './css/app.css','./css/temi.css','./js/app.js','./js/coach.js','./js/dati.js','./js/foto-piatti.js','./js/foto.js','./js/grafici.js','./js/libreria.js','./js/stampa.js','./js/resoconto.js','./js/cibo.js','./js/sync.js','./js/tema.js','./js/timer.js','./js/ui.js','./js/util.js','./js/viste/allena.js','./js/viste/cucina.js','./js/viste/impostazioni.js','./js/viste/oggi.js','./js/viste/progressi.js','./js/viste/schede.js','./js/viste/strumenti.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(BASE) && k !== CACHE && !(BASE === 'palestra-' && k.startsWith('palestra-beta')) && k !== CACHE_EXTRA).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Foto dei piatti (Wikimedia) e caratteri Google: prima la copia salvata
  if (/(^|\.)wikimedia\.org$|fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE_EXTRA).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; } catch (err) { return hit || Response.error(); }
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // La copia di prova (/beta/) ha il suo service worker
  if (BASE === 'palestra-' && url.pathname.includes('/beta/')) return;
  if (url.hostname.endsWith('script.google.com')) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
/* Tocco sulla notifica del timer: riapre l'app */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : self.clients.openWindow('./')));
});
