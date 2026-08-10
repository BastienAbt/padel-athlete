const CACHE="padel-athlete-v8";
const ASSETS=["./index.html","./styles.css","./data.js","./app.js","./patch-v6.js","./patch-v7.js","./patch-v8.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener("fetch",e=>{const req=e.request;if(req.mode==="navigate"){e.respondWith(fetch(req).catch(()=>caches.match("./index.html")));return;}e.respondWith(caches.match(req).then(r=>r||fetch(req)));});