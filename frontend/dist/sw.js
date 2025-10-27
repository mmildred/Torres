
const STATIC_CACHE='static-v1'; const DYN_CACHE='dyn-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(['/','/index.html'])));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{
  const req=e.request; const url=new URL(req.url);
  if(req.method!=='GET') return;
  if(url.pathname.startsWith('/assets/')){ e.respondWith(caches.match(req).then(r=>r||fetch(req))); return; }
  if(url.pathname.startsWith('/courses')||url.pathname.startsWith('/uploads/')){
    e.respondWith((async()=>{ const cache=await caches.open(DYN_CACHE); const cached=await cache.match(req);
      const network=fetch(req).then(res=>{cache.put(req,res.clone());return res;}).catch(()=>cached);
      return cached||network; })()); return;
  }
});
self.addEventListener('sync',e=>{ if(e.tag==='sync-queue'){ e.waitUntil(syncQueue()); } });
async function syncQueue(){ const clients=await self.clients.matchAll({includeUncontrolled:true});
  for(const c of clients){ c.postMessage({type:'SW_SYNC_REQUEST'}); } }
