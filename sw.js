/* ── Bingqilin Service Worker ── */
const CACHE_NAME   = "bingqilin-v1";
const STATIC_URLS  = [
  "./index.html",
  "./presets.js",
  "./manifest.json"
];

/* ── Install: cache core shell ── */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_URLS))
  );
  self.skipWaiting();
});

/* ── Activate: remove old caches ── */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch strategy ──
   - Same-origin (app shell, presets.js): Cache-first, fall back to network
   - Google Fonts / Material Icons CDN: Cache-first (they're versioned/immutable)
   - TMDB API requests: Network-first, fall back to cache (stale is OK for search)
   - Everything else (player iframes, external): Network-only, no caching
*/
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;

  // Google Fonts & Material Icons — cache-first
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // TMDB API — network-first with cache fallback
  if (url.hostname === "api.themoviedb.org") {
    event.respondWith(networkFirst(request));
    return;
  }

  // TMDB image CDN — cache-first (images don't change)
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Same-origin app shell — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // All else (player iframes, external APIs) — network-only
  // Don't cache or intercept player traffic
});

/* ── Strategy helpers ── */

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}
