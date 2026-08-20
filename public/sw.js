const VERSION="staerke-deine-mitte-v0427";
const CACHE_PREFIX="staerke-deine-mitte-v";
const SHELL=["/offline.html","/logo-kraftbaum.svg","/icon-192.png","/og.png","/manifest.webmanifest"];
self.addEventListener("install",event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>{const appCaches=keys.filter(key=>key.startsWith(CACHE_PREFIX)).sort();return Promise.all(appCaches.slice(0,-2).map(key=>caches.delete(key)))}).then(()=>self.clients.claim())));
function cacheable(request){const url=new URL(request.url);return request.method==="GET"&&url.origin===location.origin&&request.mode!=="navigate"&&(url.pathname.startsWith("/_next/static/")||url.pathname.startsWith("/api/dashboard")||url.pathname.startsWith("/api/courses/")||url.pathname.startsWith("/api/media/"));}
const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
async function navigateWithRetry(request){
  for(let attempt=0;attempt<12;attempt+=1){
    try{
      const response=await fetch(request);
      if(response.ok||![500,502,503,504].includes(response.status))return response;
    }catch(error){void error}
    await wait(500);
  }
  return (await caches.match("/offline.html"))||new Response("Die App wird gerade aktualisiert. Bitte versuche es gleich erneut.",{status:503,headers:{"content-type":"text/plain; charset=utf-8","retry-after":"3"}});
}
self.addEventListener("fetch",event=>{
  if(event.request.mode==="navigate"&&event.request.method==="GET"){
    event.respondWith(navigateWithRetry(event.request));
    return;
  }
  if(!cacheable(event.request))return;
  event.respondWith(
    fetch(event.request).then(async response=>{
      if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(event.request,copy));return response;}
      return (await caches.match(event.request))||response;
    }).catch(()=>caches.match(event.request).then(response=>response||new Response(JSON.stringify({offline:true,error:"Dieser Inhalt wurde noch nicht offline gespeichert."}),{status:503,headers:{"content-type":"application/json"}})))
  );
});
self.addEventListener("message",event=>{if(event.data==="CLEAR_PRIVATE_CACHES")event.waitUntil(caches.delete(VERSION))});
self.addEventListener("push",event=>{const data=event.data?.json()||{title:"Stärke deine Mitte",body:"Es gibt etwas Neues für dich.",url:"/"};const notification=self.registration.showNotification(data.title,{body:data.body,icon:"/icon-192.png",badge:"/icon-192.png",data:{url:data.url||"/"}}),appBadge="setAppBadge" in self.navigator?self.navigator.setAppBadge(1):Promise.resolve();event.waitUntil(Promise.all([notification,appBadge]))});
self.addEventListener("notificationclick",event=>{event.notification.close();const clear="clearAppBadge" in self.navigator?self.navigator.clearAppBadge():Promise.resolve(),url=event.notification.data.url||"/";event.waitUntil(Promise.all([clear,clients.matchAll({type:"window",includeUncontrolled:true}).then(windows=>{const existing=windows.find(client=>"focus" in client);return existing?existing.navigate(url).then(client=>client?.focus()):clients.openWindow(url)})]))});
