/* Service worker: prima la rete (così vedi sempre l'ultima versione), la copia salvata solo se sei offline */
const VER = '5.2.0';
const CACHE = 'palestra-' + VER;
const FILES = ['./', './index.html', './style.css', './app.js', './visual.js', './timer.js', './ricette.js', './stampa.js',
  './ricette.csv', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  // cache: 'reload' salta la cache del browser, così non salva file vecchi
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE && !k.startsWith('palestra-beta')).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  // la copia di prova (se ancora installata) non passa da qui
  if (new URL(e.request.url).pathname.includes('/beta/')) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
