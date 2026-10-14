// Service worker for My Conference Companion.
//
// Two jobs, deliberately narrow:
//   1. Make the app installable and Play-Store-eligible (a fetch handler plus a
//      registered manifest are what Chrome - and therefore the Android TWA
//      wrapper - require).
//   2. Show a branded offline page instead of the browser's error screen when
//      navigation fails, which is what a Trusted Web Activity needs to avoid
//      looking broken when the device is offline.
//
// It deliberately does NOT cache rendered HTML. The app is server-rendered and
// per-user, so a stale cached document could show one delegate another's
// session. Only the static offline shell, icons and hotel photos are cached.

const CACHE = "conference-companion-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/nse_crest.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Paths whose responses are immutable enough to serve cache-first. */
function isCacheableAsset(pathname) {
  return (
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/hotels/") ||
    pathname === "/nse_crest.png" ||
    pathname === "/favicon.ico"
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never touch cross-origin traffic (Supabase, Turnstile, Maps, tiles) or the
  // app's own API routes - those must always be live.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isCacheableAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
  }
});
