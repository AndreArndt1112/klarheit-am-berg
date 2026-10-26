// Begleiter — offline verfügbar machen
// Die App wird beim ersten Öffnen gespeichert und läuft danach ohne Netz,
// mitsamt den Schriften. Ist Netz da, wird im Hintergrund nach einer
// neueren Fassung geschaut.

const CACHE = 'begleiter-v2';
const DATEIEN = ['./', './index.html'];

// Auch diese fremden Adressen speichern, damit die Schrift offline stimmt
const AUCH_SPEICHERN = [
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

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
  const eigene = url.origin === location.origin;
  const schrift = AUCH_SPEICHERN.some((h) => url.hostname === h);
  if (!eigene && !schrift) return;

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then((gespeichert) => {
        const ausDemNetz = fetch(e.request)
          .then((antwort) => {
            // Schriften kommen teils als "opaque" zurück - trotzdem speichern
            if (antwort && (antwort.status === 200 || antwort.type === 'opaque')) {
              cache.put(e.request, antwort.clone()).catch(() => {});
            }
            return antwort;
          })
          .catch(() => gespeichert);
        return gespeichert || ausDemNetz;
      })
    )
  );
});
