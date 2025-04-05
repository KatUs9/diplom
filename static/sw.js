const CACHE_NAME = "schedule-cache-v1";

self.addEventListener("fetch", async (event) => {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(event.request);
    cache.put(event.request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(event.request);
    return cached ?? await caches.match("/offline.html");
  }
});
