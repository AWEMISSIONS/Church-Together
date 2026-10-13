// A network-only service worker avoids storing private care or contact data on shared devices.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => new Response('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:18px Arial;padding:32px;color:#173b3a"><h1>Church Together is offline</h1><p>Connect to the internet to see the latest church updates.</p></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
