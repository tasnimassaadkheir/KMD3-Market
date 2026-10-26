// =============================================================================
// KMD3 Market — service worker (sw.js)
// A small helper the browser keeps running for this site. It is what makes the
// site installable as an app, and lets it open even without internet.
//
// Rule: ALWAYS try the internet first ("network first"), so a new version of the
// app arrives as soon as it's published on Vercel — nobody gets stuck on an old
// version. Only when there's no connection does it use the copy saved here.
// Only this site's own files are handled. Supabase (the data), the maps, fonts and
// address lookups go straight to the internet as before and are never saved here.
// =============================================================================
const CACHE = "kmd3-app-v1";            // change the name to throw away all old copies
const ARQUIVOS = [                       // saved when the app is installed, so it opens offline
  "./", "index.html", "style.css", "config.js", "app.js", "mapa.js", "prospeccao.js",
  "manifest.webmanifest", "icons/icone-192.png", "icons/icone-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

// A new version takes over right away and deletes the copies of older versions.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith("kmd3-app-") && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                                   // saving data: never touched
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                    // Supabase, maps, fonts…: untouched
  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok && resp.type === "basic") {                       // keep a fresh copy for offline use
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return resp;
      })
      .catch(async () => {
        const salvo = await caches.match(req, { ignoreSearch: true });
        if (salvo) return salvo;
        if (req.mode === "navigate") return caches.match("index.html"); // any page address -> the app
        return Response.error();
      })
  );
});
