const CACHE="padel-athlete-v7";
const ASSETS=["./index.html","./styles.css","./data.js","./app.js","./patch-v6.js","./patch-v7.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.mode==="navigate"){
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      let res=await cache.match("./index.html")||await fetch("./index.html");
      let html=await res.text();
      if(!html.includes("patch-v7.js")) html=html.replace("</body>",'<script src="patch-v7.js"></script></body>');
      return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-cache"}});
    })());
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});