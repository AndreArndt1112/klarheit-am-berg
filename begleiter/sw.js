// Begleiter — offline verfügbar machen
// Die App wird beim ersten Öffnen gespeichert und läuft danach ohne Netz.
// Ist Netz da, wird im Hintergrund nach einer neueren Fassung geschaut.

const CACHE = 'begleiter-v1';
const DATEIEN = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Nur eigene Dateien behandeln; Schriften von Google laufen normal weiter
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then((gespeichert) => {
        const ausDemNetz = fetch(e.request)
          .then((antwort) => {
            if (antwort && antwort.status === 200) cache.put(e.request, antwort.clone());
            return antwort;
          })
          .catch(() => gespeichert);
        // Gespeicherte Fassung sofort zeigen, im Hintergrund aktualisieren
        return gespeichert || ausDemNetz;
      })
    )
  );
});
