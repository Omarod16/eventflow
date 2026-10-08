/*
 * SERVICEFLOWLAB OWNERSHIP & LICENSE
 * Product: Event Flow · Brand: ServiceFlowLab
 * Copyright: © 2026 ServiceFlowLab. All rights reserved.
 * This software is an original ServiceFlowLab product. Unauthorized resale, redistribution,
 * sublicensing, public sharing, repackaging, copying, or commercial redistribution of this
 * software or substantial portions of its source code is prohibited. Do not remove this notice.
 */
/* Event Flow offline support. Caches the app so it opens without internet after the first visit.
   It never reads or changes saved events (those live in the browser's local storage, not in this cache). */
var CACHE = 'event-flow-v1.0.0';
var APP_SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(APP_SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('event-flow-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    /* The page: use the network when available (to pick up updates), otherwise the cached copy */
    event.respondWith(fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', copy); }); }
      return res;
    }).catch(function () {
      return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
    }));
    return;
  }
  /* Icons and manifest: cached copy first */
  event.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
