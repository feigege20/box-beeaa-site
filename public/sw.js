// KeXinMaterials PWA Service Worker
// Strategy: stale-while-revalidate for HTML, cache-first for assets
const CACHE = "kexin-v1";
const CORE = [
  "/",
  "/styles/theme.css",
  "/manifest.json",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/images/real/hero/hero02-1600w.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // 只处理同源
  if (url.origin !== self.location.origin) return;
  // 跳过 POST/PUT 等
  if (e.request.method !== "GET") return;
  // HTML: stale-while-revalidate
  if (e.request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(e.request);
        const network = fetch(e.request)
          .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }
  // 静态资源: cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
      }
      return res;
    }).catch(() => cached))
  );
});
