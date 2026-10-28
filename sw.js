/* sw.js — il SERVICE WORKER: un aiutante che vive nel telefono anche ad app chiusa.
   Tiene una COPIA dei file dell'app ("prima la rete": con internet scarica la versione nuova,
   senza internet usa la copia, così l'app si apre anche in palestra o in piscina senza campo). */
const COPIA = "allenamento-file";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  if (new URL(r.url).hostname.endsWith("supabase.co")) return;   // i dati li gestisce dati.js
  e.respondWith(
    fetch(r)
      .then(risposta => {
        if (risposta.ok || risposta.type === "opaque") {
          const copia = risposta.clone();
          caches.open(COPIA).then(c => c.put(r, copia));
        }
        return risposta;
      })
      .catch(() => caches.match(r, { ignoreSearch: true }))
  );
});
