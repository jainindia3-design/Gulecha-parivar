/* Gulecha Parivar – offline support */
const C="gulecha-gh-v27";
const SHELL=["./","./index.html","./config.js","./firebase-shim.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./kuldevi.jpg","./kuldevi-thumb.jpg","./kuldevi-logo.jpg","./app-1.js","./app-2.js","./app-3.js","./app-4.js","./app-5.js","./app-6.js","./app-7.js","./app-8.js","./app-9.js","./join-qr.png","./kuldevta.jpg","./kuldevta-thumb.jpg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const u=new URL(req.url);
  if(u.origin===location.origin){
    if(u.pathname.startsWith("/__/")) return;              // Firebase auth helper
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(req,cp));return r;})
      .catch(()=>caches.match(req).then(r=>r||caches.match("./index.html"))));
  } else if(/(^|\.)gstatic\.com$|cdnjs\.cloudflare\.com$|fonts\.googleapis\.com$/.test(u.hostname) && !/firestore|identitytoolkit|securetoken/.test(u.hostname)){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(req,cp));return res;})));
  }
});

self.addEventListener("notificationclick",e=>{ e.notification.close(); const url=(e.notification.data&&e.notification.data.url)||"./";
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{ for(const c of list){ if("focus" in c){ c.navigate(url).catch(()=>{}); return c.focus(); } } return clients.openWindow(url); })); });
