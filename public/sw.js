const VERSION="kraftbaum-v1";
const SHELL=["/","/favicon.svg","/og.png","/manifest.webmanifest"];
self.addEventListener("install",event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
function cacheable(request){const url=new URL(request.url);return request.method==="GET"&&url.origin===location.origin&&(url.pathname==="/"||url.pathname.startsWith("/_next/static/")||url.pathname.startsWith("/api/dashboard")||url.pathname.startsWith("/api/courses/")||url.pathname.startsWith("/api/media/"));}
self.addEventListener("fetch",event=>{
  if(!cacheable(event.request))return;
  event.respondWith(
    fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>caches.match(event.request).then(response=>response||new Response(JSON.stringify({offline:true,error:"Dieser Inhalt wurde noch nicht offline gespeichert."}),{status:503,headers:{"content-type":"application/json"}})))
  );
});
self.addEventListener("message",event=>{if(event.data==="CLEAR_PRIVATE_CACHES")event.waitUntil(caches.delete(VERSION))});
