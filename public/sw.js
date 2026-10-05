const VERSION = 'aries11-pwa-v4';
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;
// offline.html is plain HTML with no framework: serving the Next.js /offline page
// at another URL would make Next try to hydrate the wrong route and error.
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/uploads/Aries11_Primary_Dark.svg', '/pwa-icon-192.png', '/pwa-icon-512.png'];
const MAX_ASSETS = 160;
const NAV_TIMEOUT_MS = 6000;

// Public, shareable pages: safe to keep a copy of for offline reading.
// Account, cart, checkout and order pages are never cached.
const PUBLIC_PAGE_PATHS = ['/', '/menu', '/about', '/contact', '/delivery', '/faq', '/privacy', '/returns', '/search', '/terms', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('aries11-pwa-') && ![PAGE_CACHE, ASSET_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isPublicPage(pathname) {
  return PUBLIC_PAGE_PATHS.includes(pathname) || pathname.startsWith('/menu/') || pathname.startsWith('/product/');
}

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

// Network first (always the latest prices), falling back to the saved copy,
// then to the branded offline page: never the browser's dinosaur.
async function navigate(request, cacheable) {
  try {
    const response = cacheable ? await fetchWithTimeout(request, NAV_TIMEOUT_MS) : await fetch(request);
    if (cacheable && response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (cacheable) {
      const saved = await caches.match(request);
      if (saved) return saved;
    }
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((key) => cache.delete(key)));
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok && response.status === 200) {
      cache.put(request, response.clone()).then(() => trim(cache, MAX_ASSETS));
    }
    return response;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/admin')) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request, isPublicPage(url.pathname)));
    return;
  }

  // Film frame sequences are hundreds of files; leave them to the HTTP cache
  // instead of growing the service-worker cache without bound.
  if (url.pathname.startsWith('/uploads/film')) return;

  if (['image', 'font', 'style', 'script'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
