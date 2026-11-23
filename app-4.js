/* ======================= Boot ======================= */
function docsFrom(snap){
  const arr = snap?.docs || (Array.isArray(snap)?snap:[]);
  return arr.map(d=>{const v=typeof d.data==="function"?d.data():(d.data||{});return {...(v||{}), id:d.id}});
}
function refreshOpen(){
  const ov=$("#overlay").classList.contains("open");
  if(!ov||!current||$("#bform")||$("#evForm")||$("#famForm")) return;
  if(String(current).startsWith("ev:")) return; // album handles itself
  if(byId(current)) openView(current);
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window._installEvt=e;});
if("serviceWorker" in navigator&&location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});
applyLangStatic();
showTab(location.hash.slice(1)||"members");
/* ---- instant start: last data from phone cache ---- */
const CK="gp_cache_v1";
let _saveT=null;
function saveCache(){ clearTimeout(_saveT); _saveT=setTimeout(()=>{ try{
  const pack=withPhotos=>JSON.stringify({t:Date.now(),uid,isAdmin,family,events:events.map(e=>({...e})),notices,members:members.map(m=>withPhotos?m:{...m,photo:""})});
  try{ localStorage.setItem(CK,pack(true)); }catch(e){ localStorage.setItem(CK,pack(false)); }
}catch(e){} },800); }
function loadCache(){ try{ const c=JSON.parse(localStorage.getItem(CK)||"null"); if(!c||!Array.isArray(c.members)) return false;
  members=c.members; events=c.events||[]; family=c.family||{}; notices=c.notices||[]; uid=c.uid||null; isAdmin=!!c.isAdmin; loaded=true;
  setStatus(""); return true; }catch(e){ return false; } }
(async function boot(){
  if(loadCache()){ try{ renderAll(); }catch(e){ console.error(e); } }
  renderTop();
  let timer=setTimeout(()=>{ if(!loaded) setStatus("Data load hone mein der ho rahi hai. Thodi der baad page dobara kholo.",true)},10000);
  try{ [db,user,downloads]=await Promise.all([claude.use("db"),claude.use("user"),claude.use("downloads")]); }catch(e){}
  if(!downloads){ $("#xlsBtn").style.display="none"; }
  if(!db){ clearTimeout(timer); setStatus("App connect nahi ho paaya. Internet check karke dobara kholo.",true); return; }
  try{ uid = user ? await user.id() : null; }catch(e){}
  try{ isAdmin = user ? !!(await user.canEdit()) : false; }catch(e){}
  try{ canWrite = user ? await user.can("data.write") : null; }catch(e){}
  if(canWrite===false) setStatus("Aap biodata dekh sakte ho. Apna bharne ke liye owner se <b>Contributor</b> access maango.");
  db.collection("members").onSnapshot(snap=>{
    clearTimeout(timer); loaded=true; members=docsFrom(snap);
    if(user&&user.key&&!byId(uid)){ const mine=members.find(m=>m.ownerKey&&m.ownerKey===user.key); if(mine) uid=mine.id; }
    if(canWrite!==false) setStatus("");
    renderAll(); refreshOpen(); saveCache();
  }, err=>{ clearTimeout(timer); console.error(err); setStatus("Data load nahi hua. Page dobara kholo.",true); });
  db.collection("events").onSnapshot(snap=>{ events=docsFrom(snap); if(loaded) renderAll(); saveCache(); }, ()=>{});
  db.collection("notices").onSnapshot(snap=>{ notices=docsFrom(snap); renderHomeExtras(); if(moreView==="notices"&&curTab()==="more") renderNotices(); }, ()=>{});
  ["recipes","stories"].forEach(c=>db.collection(c).onSnapshot(snap=>{ crudData[c]=docsFrom(snap); if(moreView===c&&curTab()==="more"&&!$("#crudQ")) renderCrud(c); }, ()=>{}));
  db.collection("family").onSnapshot(snap=>{ const d=docsFrom(snap).find(x=>x.id==="info"); family=d||{}; if(loaded&&curTab()==="parivar") renderParivar(); saveCache(); }, ()=>{});
})();
